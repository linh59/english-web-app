// Compresses an uploaded audio file client-side (ffmpeg.wasm) before it's
// stored, so users never have to pre-compress audiobooks by hand. Speech
// doesn't need Hi-Fi: mono + a low, duration-adaptive AAC bitrate cuts a
// 400MB+ raw recording down to a size that fits Supabase Storage's 50MB
// free-tier limit (see MAX_UPLOAD_SIZE_BYTES in lessons.store.ts) while
// staying clearly intelligible for both human listening and re-transcription.
//
// ffmpeg.wasm (not server-side ffmpeg, not MediaRecorder):
// - Supabase Edge Functions run on Deno Deploy's sandbox, which can't shell
//   out to a native ffmpeg binary — same platform constraint that already
//   forced transcription to be client-side chunked (see transcribe-chunk).
// - MediaRecorder re-encodes in real time by playing audio through the audio
//   graph, so compressing a multi-hour audiobook would take multiple real
//   hours. Not viable for this app's actual (>1h) target audio length.
// - ffmpeg.wasm transcodes as fast as the CPU allows, independent of the
//   audio's own duration.
//
// Single-threaded @ffmpeg/core (not @ffmpeg/core-mt): the multithreaded core
// needs SharedArrayBuffer, which needs site-wide COOP/COEP response headers —
// a cross-cutting hosting change with its own risk. Single-threaded is slower
// per file but needs zero infra changes.
//
// Output format: mono AAC in an .m4a container. ffmpeg's default build only
// has the native AAC-LC encoder (no libfdk_aac — license-restricted, not in
// default builds), but AAC/M4A is what matters here anyway: this compressed
// file is what gets played back directly via <audio> (see AudioPlayer.vue),
// and Opus/WebM (better quality-per-bit) isn't reliably playable in Safari.
import { fetchFile } from '@ffmpeg/util'
import { loadFfmpeg, probeDuration } from './ffmpeg-client'

// Target storage footprint, with headroom under the real 50MB Supabase
// Storage limit (MAX_UPLOAD_SIZE_BYTES in lessons.store.ts) to absorb
// container/muxing overhead.
const STORAGE_BUDGET_BYTES = 45 * 1024 * 1024

// Below ~16kbps, ffmpeg's native AAC-LC encoder (no HE-AAC/SBR available)
// gets audibly rough for speech — but the primary requirement is that
// compression must actually succeed and never drop content/duration, so the
// floor stays low enough to fit real multi-hour audiobooks (a real 436MB/
// ~5h03m test file needs ~20.7kbps to hit the storage budget; a 24kbps floor
// clamped it upward and pushed the output back over the 50MB cap — lowering
// the floor to 16kbps fixes that). Above ~64kbps there's no real benefit for
// mono speech-only content, so no reason to spend the extra bytes.
const BITRATE_MIN_KBPS = 16
const BITRATE_MAX_KBPS = 64

// Lower sample rate reads as cleaner than a higher one squeezed into very
// few bits (less spectral detail to code, fewer pre-echo artifacts).
const SAMPLE_RATE_LOW = 16000
const SAMPLE_RATE_HIGH = 22050

export type CompressionPhase = 'loading' | 'compressing'
export type CompressionProgressCallback = (phase: CompressionPhase, progress: number) => void

function pickEncodingParams(durationSeconds: number): { bitrateKbps: number, sampleRate: number } {
  const isValidDuration = Number.isFinite(durationSeconds) && durationSeconds > 0
  const idealKbps = isValidDuration ? (STORAGE_BUDGET_BYTES * 8) / durationSeconds / 1000 : BITRATE_MIN_KBPS
  const bitrateKbps = Math.max(BITRATE_MIN_KBPS, Math.min(BITRATE_MAX_KBPS, Math.floor(idealKbps)))
  const sampleRate = bitrateKbps <= 32 ? SAMPLE_RATE_LOW : SAMPLE_RATE_HIGH
  return { bitrateKbps, sampleRate }
}

export async function compressAudioFile(file: File, onProgress?: CompressionProgressCallback): Promise<File> {
  const ffmpeg = await loadFfmpeg((ratio) => onProgress?.('loading', ratio)).catch((error) => {
    throw new Error(`COMPRESSION_LOAD_FAILED: ${error instanceof Error ? error.message : String(error)}`)
  })
  const duration = await probeDuration(file)
  const { bitrateKbps, sampleRate } = pickEncodingParams(duration)

  const inputName = `input_${crypto.randomUUID()}`
  const outputName = `output_${crypto.randomUUID()}.m4a`

  const onExecProgress = ({ progress }: { progress: number }) => {
    onProgress?.('compressing', Math.max(0, Math.min(1, progress)))
  }

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    ffmpeg.on('progress', onExecProgress)

    const exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-vn', // drop cover-art image streams some MP3s embed (would otherwise break muxing to m4a)
      '-map_metadata', '-1',
      '-ac', '1',
      '-ar', String(sampleRate),
      '-c:a', 'aac',
      '-b:a', `${bitrateKbps}k`,
      '-movflags', '+faststart',
      outputName,
    ])
    if (exitCode !== 0) {
      throw new Error(`ffmpeg exited with code ${exitCode}`)
    }

    const data = await ffmpeg.readFile(outputName)
    const bytes = data as Uint8Array
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    // ffmpeg.wasm's Uint8Array is typed with an ArrayBufferLike (which
    // includes SharedArrayBuffer) backing buffer; Blob/File only accept a
    // concrete ArrayBuffer. The underlying bytes are a plain ArrayBuffer at
    // runtime (this build never touches SharedArrayBuffer), so this is a type
    // assertion, not a behavior change.
    return new File([bytes as unknown as BlobPart], `${baseName}.m4a`, { type: 'audio/mp4' })
  } catch (error) {
    throw new Error(`COMPRESSION_FAILED: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    ffmpeg.off('progress', onExecProgress)
    await ffmpeg.deleteFile(inputName).catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
  }
}
