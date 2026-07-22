// Deno Edge Function. Transcribes ONE short audio chunk (a few minutes, sent
// directly as the raw request body) and returns sentences with chunk-relative
// timestamps. Stateless on purpose — no database access.
//
// Why chunks instead of the whole lesson in one call: Supabase Edge Functions
// have a hard execution ceiling that even EdgeRuntime.waitUntil() background
// tasks cannot exceed, and the platform kills the isolate without giving our
// own code a chance to react (a JS-level timeout race does NOT help — verified
// empirically with a ~1h50m real audio file, which got silently killed mid
// generateContent call with no error ever written). A single generateContent
// call over a short chunk (a few minutes) comfortably finishes in time; the
// caller (features/lessons store) is responsible for splitting the full lesson
// into chunks, calling this function once per chunk, and offsetting timestamps.
//
// Model: gemini-flash-lite-latest (an alias Google keeps pointed at their
// current recommended lightweight flash model, so it doesn't go stale like a
// dated model name). Chosen after this API key/project rejected several
// pinned model names outright: gemini-3.5-flash gave persistent 503 "high
// demand"; gemini-2.5-flash and gemini-2.5-flash-lite are listed by
// models.list() but generateContent 404s them as "no longer available to new
// users"; gemini-2.0-flash and gemini-2.0-flash-lite have a hard 0 free-tier
// quota for this project. The -latest alias was the first to actually work.
import { GoogleGenAI, Type } from 'npm:@google/genai'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TRANSCRIPT_PROMPT = `Transcribe this audio in English. Split the transcript into natural sentences.
For each sentence return its start and end time in seconds from the beginning of THIS audio clip.
Also translate each sentence into natural Vietnamese.
Return only the sentences, no filler words or transcription notes.`

const SENTENCE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      startTime: { type: Type.NUMBER },
      endTime: { type: Type.NUMBER },
      translation: { type: Type.STRING },
    },
    required: ['text', 'startTime', 'endTime', 'translation'],
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const mimeType = req.headers.get('content-type') || 'audio/wav'
    const audioBytes = new Uint8Array(await req.arrayBuffer())
    if (audioBytes.length === 0) {
      return new Response(JSON.stringify({ error: 'Empty audio body' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    let file = await ai.files.upload({
      file: new Blob([audioBytes], { type: mimeType }),
      config: { mimeType },
    })
    let attempts = 0
    while (file.state === 'PROCESSING' && attempts < 60) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      file = await ai.files.get({ name: file.name! })
      attempts += 1
    }
    if (file.state !== 'ACTIVE') {
      return new Response(JSON.stringify({ error: `Gemini file state: ${file.state}` }), {
        status: 502,
        headers: CORS_HEADERS,
      })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: TRANSCRIPT_PROMPT },
            { fileData: { fileUri: file.uri!, mimeType: file.mimeType! } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: SENTENCE_SCHEMA,
      },
    })

    const rawText = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return new Response(JSON.stringify({ error: 'Gemini returned an empty response' }), {
        status: 502,
        headers: CORS_HEADERS,
      })
    }

    const sentences = JSON.parse(rawText)
    return new Response(JSON.stringify({ sentences }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
