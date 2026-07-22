// Splits an audio file into ~6-minute segments so each one can be
// transcribed by Gemini within an Edge Function's execution time limit (see
// supabase/functions/transcribe-chunk for why chunking exists at all).
//
// Uses ffmpeg.wasm's segment muxer with `-c copy` (stream copy — no decode,
// no re-encode) rather than decoding the whole file into one in-memory PCM
// buffer via the Web Audio API (the original approach here). That approach
// broke on a real ~5h03m audiobook: decodeAudioData tried to allocate
// ~1.16GB of Float32 PCM (16kHz mono * 4 bytes/sample * 18198s) and failed
// outright with "Unable to decode audio data" — verified with the real file,
// not a hypothetical edge case. Segmenting via ffmpeg needs none of that: it
// repackages existing AAC frames into new container files without ever
// materializing raw PCM, so it scales to any length.
//
// Chunks come out in the audio's own already-compressed format (m4a/AAC —
// see audio-compression.ts, which every upload passes through before this
// ever runs). transcribe-chunk forwards whatever Content-Type it receives
// straight to Gemini, so there's no need to re-encode to WAV here.
import { fetchFile } from '@ffmpeg/util'
import { loadFfmpeg, probeDuration } from './ffmpeg-client'

export interface AudioChunk {
  blob: Blob
  mimeType: string
  startTime: number
  endTime: number
}

export async function chunkAudioFile(
  file: File,
  chunkSeconds: number,
): Promise<{ chunks: AudioChunk[], totalDuration: number }> {
  const ffmpeg = await loadFfmpeg()
  const totalDuration = await probeDuration(file)

  const runId = crypto.randomUUID()
  const inputName = `chunkin_${runId}.m4a`
  const outputPrefix = `chunkout_${runId}_`
  const writtenFiles = [inputName]

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))

    const exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-map', '0:a',
      '-c', 'copy',
      '-f', 'segment',
      '-segment_time', String(chunkSeconds),
      '-reset_timestamps', '1',
      `${outputPrefix}%04d.m4a`,
    ])
    if (exitCode !== 0) {
      throw new Error(`ffmpeg exited with code ${exitCode}`)
    }

    const entries = await ffmpeg.listDir('/')
    const chunkNames = entries.map((entry) => entry.name).filter((name) => name.startsWith(outputPrefix)).sort()
    writtenFiles.push(...chunkNames)

    const chunks: AudioChunk[] = []
    for (let i = 0; i < chunkNames.length; i++) {
      const data = await ffmpeg.readFile(chunkNames[i])
      const bytes = data as Uint8Array
      const fallbackEnd = (i + 1) * chunkSeconds
      chunks.push({
        // See audio-compression.ts for why this cast is safe (Blob/File only
        // accept a concrete ArrayBuffer; ffmpeg.wasm types the backing
        // buffer as ArrayBufferLike, which this build never actually uses
        // as SharedArrayBuffer).
        blob: new Blob([bytes as unknown as BlobPart], { type: 'audio/mp4' }),
        mimeType: 'audio/mp4',
        startTime: i * chunkSeconds,
        endTime: Number.isFinite(totalDuration) && totalDuration > 0 ? Math.min(fallbackEnd, totalDuration) : fallbackEnd,
      })
    }

    return { chunks, totalDuration }
  } finally {
    await Promise.all(writtenFiles.map((name) => ffmpeg.deleteFile(name).catch(() => {})))
  }
}
