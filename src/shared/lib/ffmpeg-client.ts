// Shared ffmpeg.wasm singleton, used by both audio-compression.ts
// (pre-upload compression) and audio-chunking.ts (segmenting for
// transcription) so the ~31MB core is only ever loaded once per session,
// whichever feature triggers it first.
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

const CORE_BASE_URL = '/ffmpeg'

export type FfmpegLoadProgressCallback = (progress: number) => void

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

export function loadFfmpeg(onProgress?: FfmpegLoadProgressCallback): Promise<FFmpeg> {
  if (ffmpegInstance) return Promise.resolve(ffmpegInstance)
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg()
    const coreURL = await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript', true, (event) => {
      if (event.total > 0) onProgress?.(event.received / event.total)
    })
    const wasmURL = await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm')
    await ffmpeg.load({ coreURL, wasmURL })
    ffmpegInstance = ffmpeg
    return ffmpeg
  })().catch((error) => {
    loadPromise = null
    throw error
  })

  return loadPromise
}

// Cheap duration probe via a plain <audio> element — avoids fully decoding
// the file into memory (the whole problem this module's callers exist to
// avoid) just to read one number.
export function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const cleanup = () => URL.revokeObjectURL(url)

    audio.preload = 'metadata'
    audio.addEventListener('loadedmetadata', () => {
      cleanup()
      resolve(audio.duration)
    })
    audio.addEventListener('error', () => {
      cleanup()
      resolve(NaN)
    })
    audio.src = url
  })
}
