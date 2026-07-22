import type { RealtimeChannel } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { chunkAudioFile } from '@/shared/lib/audio-chunking'
import type { LessonRow, LessonSentenceRow } from '@/shared/lib/database.types'
import { supabase } from '@/shared/lib/supabase'
import type { Lesson, LessonSentence } from '../types'

// Supabase Storage free-tier file size limit. Kept here (not just as a
// Storage-side error) so the upload dialog can validate before even trying.
export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024

// Each chunk is transcribed by its own Edge Function call, so it must finish
// well within the platform's execution time limit. 6 minutes of 16kHz mono
// audio comfortably does; see supabase/functions/transcribe-chunk for why.
const CHUNK_SECONDS = 6 * 60

// Gemini occasionally returns a transient 503 ("high demand, try again later")
// — normal for any LLM API, not a bug. Retry a few times with backoff instead
// of failing the whole (potentially hour-long) lesson over one flaky chunk.
const CHUNK_MAX_ATTEMPTS = 4
const CHUNK_RETRY_DELAYS_MS = [3000, 8000, 20000]

// supabase.functions.invoke() has no timeout by default: if the Edge Function
// invocation itself hangs (observed in testing — same silent-kill behavior as
// the original single-call design, just now on one chunk instead of the whole
// file), the client would await forever and the retry loop above would never
// even reach a second attempt. A hard per-attempt timeout turns that hang into
// a normal retryable error instead.
const CHUNK_INVOKE_TIMEOUT_MS = 90 * 1000

interface RawSentence {
  text: string
  startTime: number
  endTime: number
}

// supabase-js's function invoke errors collapse the real cause into a generic
// "non-2xx status code" message; the actual reason is in the response body.
async function toDetailedError(error: unknown): Promise<Error> {
  const context = (error as { context?: Response }).context
  if (context instanceof Response) {
    try {
      const body = await context.clone().json()
      if (body?.error) return new Error(String(body.error))
    } catch {
      // response wasn't JSON — fall through to the generic error below
    }
  }
  return error instanceof Error ? error : new Error(String(error))
}

async function invokeTranscribeChunkWithRetry(blob: Blob): Promise<{ sentences: RawSentence[] }> {
  let lastError: Error = new Error('Unknown error')

  for (let attempt = 0; attempt < CHUNK_MAX_ATTEMPTS; attempt++) {
    const { data, error } = await supabase.functions.invoke('transcribe-chunk', {
      body: blob,
      headers: { 'Content-Type': 'audio/wav' },
      timeout: CHUNK_INVOKE_TIMEOUT_MS,
    })
    if (!error) return data

    lastError = await toDetailedError(error)
    if (attempt < CHUNK_RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_RETRY_DELAYS_MS[attempt]))
    }
  }

  throw lastError
}

function mapLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    title: row.title,
    audioPath: row.audio_path,
    status: row.status,
    durationSeconds: row.duration_seconds,
    errorMessage: row.error_message,
    processingStep: row.processing_step,
    createdAt: row.created_at,
  }
}

export const useLessonsStore = defineStore('lessons', () => {
  const lessons = ref<Lesson[]>([])
  const loading = ref(false)
  let channel: RealtimeChannel | null = null

  function subscribeToUpdates(userId: string) {
    if (channel) return
    channel = supabase
      .channel('lessons-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lessons', filter: `user_id=eq.${userId}` },
        (payload) => {
          const updated = mapLesson(payload.new as LessonRow)
          const index = lessons.value.findIndex((l) => l.id === updated.id)
          if (index !== -1) lessons.value[index] = updated
        },
      )
      .subscribe()
  }

  async function fetchLessons() {
    const authStore = useAuthStore()
    const userId = authStore.user!.id

    loading.value = true
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    loading.value = false
    if (error) throw error

    lessons.value = (data as LessonRow[]).map(mapLesson)
    subscribeToUpdates(userId)
  }

  // Realtime (subscribeToUpdates) keeps `lessons.value` in sync with these
  // writes, so this only needs to touch the database.
  async function updateLessonRow(id: string, patch: Partial<LessonRow>) {
    await supabase.from('lessons').update(patch).eq('id', id)
  }

  // Chunk indices that already have sentences saved for this lesson — from a
  // prior attempt that got partway through before failing. Lets processLessonAudio
  // skip re-transcribing (and re-spending Gemini quota on) chunks already done.
  async function fetchCompletedChunks(lessonId: string): Promise<{ completedChunkIndices: Set<number>, nextSentenceIndex: number }> {
    const { data, error } = await supabase
      .from('lesson_sentences')
      .select('chunk_index')
      .eq('lesson_id', lessonId)
    if (error) throw error

    const rows = data as Pick<LessonSentenceRow, 'chunk_index'>[]
    return {
      completedChunkIndices: new Set(rows.map((row) => row.chunk_index)),
      nextSentenceIndex: rows.length,
    }
  }

  async function processLessonAudio(lessonId: string, file: File) {
    try {
      const { chunks, totalDuration } = await chunkAudioFile(file, CHUNK_SECONDS)
      const { completedChunkIndices, nextSentenceIndex } = await fetchCompletedChunks(lessonId)
      let sentenceIndex = nextSentenceIndex

      for (let i = 0; i < chunks.length; i++) {
        await updateLessonRow(lessonId, { processing_step: `chunk ${i + 1}/${chunks.length}` })

        if (completedChunkIndices.has(i)) continue

        const data = await invokeTranscribeChunkWithRetry(chunks[i].blob)
        const sentences = (data.sentences as RawSentence[]).map((sentence) => ({
          text: sentence.text,
          startTime: sentence.startTime + chunks[i].startTime,
          endTime: sentence.endTime + chunks[i].startTime,
        }))

        // Insert this chunk's sentences right away — if a later chunk fails
        // (e.g. Gemini quota runs out), this chunk's work is not lost and a
        // retry can resume from the next chunk instead of starting over.
        const { error: insertError } = await supabase.from('lesson_sentences').insert(
          sentences.map((sentence, offset) => ({
            lesson_id: lessonId,
            sentence_index: sentenceIndex + offset,
            chunk_index: i,
            text: sentence.text,
            start_time: sentence.startTime,
            end_time: sentence.endTime,
          })),
        )
        if (insertError) throw insertError
        sentenceIndex += sentences.length
      }

      await updateLessonRow(lessonId, {
        status: 'done',
        duration_seconds: Math.round(totalDuration),
        processing_step: null,
      })
    } catch (error) {
      // Keep processing_step as-is (don't null it) so a failed lesson still
      // shows which chunk it died on.
      await updateLessonRow(lessonId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async function uploadLesson(file: File, title: string) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error('FILE_TOO_LARGE')
    }

    const authStore = useAuthStore()
    const userId = authStore.user!.id
    const id = crypto.randomUUID()
    const extension = file.name.split('.').pop()
    const audioPath = `${userId}/${id}.${extension}`

    const { error: uploadError } = await supabase.storage.from('audio').upload(audioPath, file)
    if (uploadError) throw uploadError

    const { data, error: insertError } = await supabase
      .from('lessons')
      .insert({ id, user_id: userId, title, audio_path: audioPath, status: 'processing' })
      .select()
      .single()
    if (insertError) throw insertError

    lessons.value.unshift(mapLesson(data as LessonRow))
    subscribeToUpdates(userId)

    // Chunked transcription runs client-side (see processLessonAudio) because a
    // single Edge Function call can't reliably transcribe long audio in one
    // shot — see supabase/functions/transcribe-chunk for why. It keeps running
    // as long as this tab stays open; closing it mid-upload leaves the lesson
    // stuck at "processing" (a known V1 limitation, documented in CLAUDE.md).
    processLessonAudio(id, file)
  }

  // Re-runs processing for a failed lesson, downloading the original audio
  // back from Storage (the File object from the original upload only lived in
  // that browser tab). processLessonAudio re-chunks it identically (same file,
  // same CHUNK_SECONDS) and skips chunks that already have sentences saved,
  // so already-transcribed chunks don't re-spend Gemini quota.
  async function retryLesson(id: string) {
    const lesson = lessons.value.find((l) => l.id === id)
    if (!lesson) return

    const audioUrl = await getAudioSignedUrl(lesson.audioPath)
    const response = await fetch(audioUrl)
    const blob = await response.blob()
    const filename = lesson.audioPath.split('/').pop()!
    const file = new File([blob], filename, { type: blob.type })

    await updateLessonRow(id, { status: 'processing', error_message: null })
    processLessonAudio(id, file)
  }

  async function deleteLesson(id: string) {
    const lesson = lessons.value.find((l) => l.id === id)
    if (!lesson) return

    await supabase.storage.from('audio').remove([lesson.audioPath])
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) throw error

    lessons.value = lessons.value.filter((l) => l.id !== id)
  }

  async function fetchLessonById(id: string): Promise<Lesson> {
    const { data, error } = await supabase.from('lessons').select('*').eq('id', id).single()
    if (error) throw error
    return mapLesson(data as LessonRow)
  }

  // PostgREST caps rows per request (1000 by default) regardless of the
  // absence of an explicit .limit() — long lessons (1000+ sentences) would
  // silently lose their tail. Page through with .range() until a page comes
  // back short.
  async function fetchLessonSentences(lessonId: string): Promise<LessonSentence[]> {
    const PAGE_SIZE = 1000
    const rows: LessonSentenceRow[] = []

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('lesson_sentences')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sentence_index', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)
      if (error) throw error

      const page = data as LessonSentenceRow[]
      rows.push(...page)
      if (page.length < PAGE_SIZE) break
    }

    return rows.map((row) => ({
      id: row.id,
      sentenceIndex: row.sentence_index,
      text: row.text,
      startTime: row.start_time,
      endTime: row.end_time,
    }))
  }

  async function getAudioSignedUrl(audioPath: string): Promise<string> {
    const { data, error } = await supabase.storage.from('audio').createSignedUrl(audioPath, 3600)
    if (error) throw error
    return data.signedUrl
  }

  return {
    lessons,
    loading,
    fetchLessons,
    uploadLesson,
    retryLesson,
    deleteLesson,
    fetchLessonById,
    fetchLessonSentences,
    getAudioSignedUrl,
  }
})
