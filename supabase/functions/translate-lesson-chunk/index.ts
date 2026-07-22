// Deno Edge Function. Translates a batch of already-transcribed sentences (plain
// text, no audio) into a target language. Used only by the "Translate" retrofit
// flow for lessons that finished transcription before per-sentence translation
// existed — new lessons get translations for free as part of transcribe-chunk's
// response instead. Stateless on purpose — no database access, mirrors
// transcribe-chunk's conventions.
//
// Sentences are sent/returned as a plain string[] (position = index) rather than
// {id, text} objects: structured-output models are more reliable at preserving
// array order/length than at echoing back opaque UUID strings verbatim. The
// caller is responsible for zipping the response back onto its own sentence ids
// by index, and must treat a length mismatch as a failure (see below).
import { GoogleGenAI, Type } from 'npm:@google/genai'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TRANSLATIONS_SCHEMA = {
  type: Type.ARRAY,
  items: { type: Type.STRING },
}

function buildPrompt(targetLanguage: string, count: number): string {
  return `Translate each of the following ${count} English sentences into natural ${targetLanguage}.
Return a JSON array of exactly ${count} strings, in the same order as the input, with one translation per sentence.
Do not merge, skip, or reorder sentences.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const sentences = body?.sentences
    const targetLanguage = body?.targetLanguage ?? 'Vietnamese'

    if (!Array.isArray(sentences) || sentences.length === 0 || !sentences.every((s) => typeof s === 'string')) {
      return new Response(JSON.stringify({ error: 'Body must include a non-empty string[] "sentences"' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: buildPrompt(targetLanguage, sentences.length) },
            { text: JSON.stringify(sentences) },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: TRANSLATIONS_SCHEMA,
      },
    })

    const rawText = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return new Response(JSON.stringify({ error: 'Gemini returned an empty response' }), {
        status: 502,
        headers: CORS_HEADERS,
      })
    }

    const translations = JSON.parse(rawText)
    if (!Array.isArray(translations) || translations.length !== sentences.length) {
      return new Response(
        JSON.stringify({ error: `Expected ${sentences.length} translations, got ${Array.isArray(translations) ? translations.length : 'non-array'}` }),
        { status: 502, headers: CORS_HEADERS },
      )
    }

    return new Response(JSON.stringify({ translations }), {
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
