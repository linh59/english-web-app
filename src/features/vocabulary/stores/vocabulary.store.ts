import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { VocabularyRow } from '@/shared/lib/database.types'
import { supabase } from '@/shared/lib/supabase'
import type { VocabularyItem, WordLookupResult } from '../types'

function mapVocabulary(row: VocabularyRow): VocabularyItem {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning ?? '',
    definitionEn: row.definition_en ?? '',
    exampleSentence: row.example_sentence ?? '',
    lessonId: row.lesson_id,
    startTime: row.start_time,
    endTime: row.end_time,
    encounterCount: row.encounter_count,
    partOfSpeech: row.part_of_speech,
    wordType: row.word_type as VocabularyItem['wordType'],
    cefrLevel: row.cefr_level as VocabularyItem['cefrLevel'],
    synonyms: row.synonyms ?? [],
    antonyms: row.antonyms ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface SaveVocabularyInput {
  word: string
  meaning: string
  definitionEn: string
  exampleSentence: string
  lessonId?: string
  startTime?: number
  endTime?: number
  partOfSpeech?: string | null
  wordType?: string | null
  cefrLevel?: string | null
  synonyms?: string[]
  antonyms?: string[]
}

export const useVocabularyStore = defineStore('vocabulary', () => {
  const items = ref<VocabularyItem[]>([])
  const loading = ref(false)
  const searchQuery = ref('')

  const filteredItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return items.value
    return items.value.filter(
      (item) =>
        item.word.toLowerCase().includes(query) || item.meaning.toLowerCase().includes(query),
    )
  })

  async function fetchVocabulary() {
    const authStore = useAuthStore()

    loading.value = true
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', authStore.user!.id)
      .order('created_at', { ascending: false })
    loading.value = false
    if (error) throw error

    items.value = (data as VocabularyRow[]).map(mapVocabulary)
  }

  // Looks up a word/phrase's meaning + classification via the
  // lookup-word-meaning Edge Function (cache hit is free; a miss costs one
  // Gemini call for the whole system, see the function's own comments).
  // Never throws — a lookup failure just means VocabularyPopup falls back to
  // manual entry, it must not block saving a word.
  async function lookupWordMeaning(word: string, sentence: string): Promise<WordLookupResult | null> {
    const { data, error } = await supabase.functions.invoke('lookup-word-meaning', {
      body: { word, sentence },
      timeout: 20_000,
    })
    if (error) return null
    return data as WordLookupResult
  }

  // Upserts on (user_id, word_key) — see the unique index in the migration.
  // Re-selecting a word already saved updates its example/context to the
  // latest occurrence and bumps encounter_count instead of creating a
  // duplicate row; encounter_count is the "exposure" signal shown on
  // VocabularyCard.
  async function saveVocabulary(input: SaveVocabularyInput) {
    const authStore = useAuthStore()
    const wordNormalized = input.word.toLowerCase()
    const existing = items.value.find((item) => item.word.toLowerCase() === wordNormalized)

    const { data, error } = await supabase
      .from('vocabulary')
      .upsert(
        {
          user_id: authStore.user!.id,
          lesson_id: input.lessonId ?? existing?.lessonId ?? null,
          word: input.word,
          meaning: input.meaning,
          definition_en: input.definitionEn,
          example_sentence: input.exampleSentence,
          part_of_speech: input.partOfSpeech ?? null,
          word_type: input.wordType ?? null,
          cefr_level: input.cefrLevel ?? null,
          synonyms: input.synonyms ?? [],
          antonyms: input.antonyms ?? [],
          start_time: input.startTime ?? existing?.startTime ?? null,
          end_time: input.endTime ?? existing?.endTime ?? null,
          encounter_count: (existing?.encounterCount ?? 0) + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,word_key' },
      )
      .select()
      .single()
    if (error) throw error

    const saved = mapVocabulary(data as VocabularyRow)
    const index = items.value.findIndex((item) => item.id === saved.id)
    if (index !== -1) {
      items.value[index] = saved
    } else {
      items.value.unshift(saved)
    }
  }

  async function updateVocabulary(
    id: string,
    patch: { meaning: string; definitionEn: string },
  ) {
    const { data, error } = await supabase
      .from('vocabulary')
      .update({
        meaning: patch.meaning,
        definition_en: patch.definitionEn,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    const updated = mapVocabulary(data as VocabularyRow)
    const index = items.value.findIndex((item) => item.id === id)
    if (index !== -1) items.value[index] = updated
  }

  async function deleteVocabulary(id: string) {
    const { error } = await supabase.from('vocabulary').delete().eq('id', id)
    if (error) throw error

    items.value = items.value.filter((item) => item.id !== id)
  }

  return {
    items,
    filteredItems,
    loading,
    searchQuery,
    fetchVocabulary,
    lookupWordMeaning,
    saveVocabulary,
    updateVocabulary,
    deleteVocabulary,
  }
})
