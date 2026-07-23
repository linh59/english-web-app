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

    // `-c copy` cuts each segment on the nearest packet boundary to
    // `segment_time`, not exactly at it — so a chunk's real duration always
    // deviates slightly from the nominal `chunkSeconds`. Using `i *
    // chunkSeconds` as the offset (the original approach) ignores that
    // deviation and lets it accumulate linearly across chunks: harmless for
    // a 2-chunk lesson, but tens of seconds off by the last chunk of a
    // multi-hour file with 30+ chunks (verified against real >3h audio).
    // Measuring each chunk's actual duration and carrying a running sum
    // keeps every chunk's offset exact regardless of chunk count.
    const chunks: AudioChunk[] = []
    let runningOffset = 0
    for (let i = 0; i < chunkNames.length; i++) {
      const data = await ffmpeg.readFile(chunkNames[i])
      const bytes = data as Uint8Array
      // See audio-compression.ts for why this cast is safe (Blob/File only
      // accept a concrete ArrayBuffer; ffmpeg.wasm types the backing
      // buffer as ArrayBufferLike, which this build never actually uses
      // as SharedArrayBuffer).
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'audio/mp4' })
      const measuredDuration = await probeDuration(blob)
      const actualDuration = Number.isFinite(measuredDuration) && measuredDuration > 0 ? measuredDuration : chunkSeconds

      const startTime = runningOffset
      const fallbackEnd = startTime + actualDuration
      chunks.push({
        blob,
        mimeType: 'audio/mp4',
        startTime,
        endTime: Number.isFinite(totalDuration) && totalDuration > 0 ? Math.min(fallbackEnd, totalDuration) : fallbackEnd,
      })
      runningOffset += actualDuration
    }

    return { chunks, totalDuration }
  } finally {
    await Promise.all(writtenFiles.map((name) => ffmpeg.deleteFile(name).catch(() => {})))
  }
}
