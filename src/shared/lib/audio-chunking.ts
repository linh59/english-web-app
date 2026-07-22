// Splits a decoded audio file into short mono 16kHz WAV chunks so each one can
// be transcribed by Gemini within an Edge Function's execution time limit.
// A single generateContent call over a >1h file reliably gets killed by the
// platform with no error surfaced (verified with a real ~1h50m audiobook) —
// short chunks (a few minutes each) comfortably finish in time.
const TARGET_SAMPLE_RATE = 16000

export interface AudioChunk {
  blob: Blob
  startTime: number
  endTime: number
}

async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext()
  try {
    return await audioContext.decodeAudioData(arrayBuffer)
  } finally {
    audioContext.close()
  }
}

function toMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0)

  const mono = new Float32Array(buffer.length)
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < buffer.length; i++) mono[i] += data[i] / buffer.numberOfChannels
  }
  return mono
}

function resampleLinear(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples

  const ratio = fromRate / toRate
  const newLength = Math.round(samples.length / ratio)
  const result = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    const srcPos = i * ratio
    const srcIndex = Math.floor(srcPos)
    const frac = srcPos - srcIndex
    const a = samples[srcIndex] ?? 0
    const b = samples[srcIndex + 1] ?? a
    result[i] = a + (b - a) * frac
  }
  return result
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2
  const byteRate = sampleRate * bytesPerSample
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  function writeString(offset: number, text: string) {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
    offset += bytesPerSample
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export async function chunkAudioFile(
  file: File,
  chunkSeconds: number,
): Promise<{ chunks: AudioChunk[], totalDuration: number }> {
  const buffer = await decodeAudioFile(file)
  const resampled = resampleLinear(toMono(buffer), buffer.sampleRate, TARGET_SAMPLE_RATE)
  const totalDuration = resampled.length / TARGET_SAMPLE_RATE
  const samplesPerChunk = chunkSeconds * TARGET_SAMPLE_RATE

  const chunks: AudioChunk[] = []
  for (let start = 0; start < resampled.length; start += samplesPerChunk) {
    const end = Math.min(start + samplesPerChunk, resampled.length)
    chunks.push({
      blob: encodeWav(resampled.subarray(start, end), TARGET_SAMPLE_RATE),
      startTime: start / TARGET_SAMPLE_RATE,
      endTime: end / TARGET_SAMPLE_RATE,
    })
  }

  return { chunks, totalDuration }
}
