// Deno Edge Function. Looks up the meaning + classification of a word/phrase a
// learner selected while studying, given the sentence it appeared in.
//
// Unlike transcribe-chunk/translate-lesson-chunk (stateless, no DB access by
// design), this function owns a shared cache table (word_lookups) so the same
// (word, sentence) pair only ever costs one Gemini call across the WHOLE
// system, not per user or per save — that shared cache is the real cost
// lever, not "avoiding Gemini".
//
// Gemini is the primary source: free dictionary APIs cannot classify phrasal
// verbs/idioms/collocations, cannot give a CEFR level, and cannot pick
// context-correct synonyms/antonyms (a word's sense depends on the sentence,
// e.g. "left" = direction vs past tense of "leave"). Free Dictionary API
// (dictionaryapi.dev) only backfills `phonetic` for single words when Gemini
// succeeds, and serves as a degraded fallback (definition/part of speech/
// phonetic only, no classification) if Gemini errors or hits quota, so Save
// is never fully blocked — the caller falls back to manual entry from there.
import { GoogleGenAI, Type } from 'npm:@google/genai'
import { createClient } from 'npm:@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const WORD_TYPES = ['single_word', 'phrasal_verb', 'idiom', 'collocation', 'phrase']
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LOOKUP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    definitionEn: { type: Type.STRING },
    meaningVi: { type: Type.STRING },
    partOfSpeech: { type: Type.STRING },
    wordType: { type: Type.STRING, enum: WORD_TYPES },
    cefrLevel: { type: Type.STRING, enum: CEFR_LEVELS },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['definitionEn', 'meaningVi', 'partOfSpeech', 'wordType', 'synonyms', 'antonyms'],
}

function buildPrompt(word: string, sentence: string): string {
  return `An English learner is listening to real audio and selected the following word or phrase: "${word}"
It appeared in this sentence: "${sentence}"

Analyze it exactly as used in this context and return:
- definitionEn: a concise, monolingual English definition/explanation of its meaning in this exact context (no Vietnamese).
- meaningVi: the corresponding Vietnamese meaning in this exact context.
- partOfSpeech: its grammatical role in this sentence (e.g. noun, verb, adjective, phrasal verb, idiom).
- wordType: "single_word" if it is one dictionary word; "phrasal_verb" if it is a verb+particle combination acting as one unit; "idiom" if its meaning cannot be derived from its individual words; "collocation" if it is a natural, commonly-paired combination of words that is still compositional; "phrase" for any other multi-word selection.
- cefrLevel: the CEFR level (A1-C2) that best matches this word/phrase's difficulty. Omit this field entirely if not applicable (e.g. many idioms don't map cleanly to a CEFR level).
- synonyms: up to 4 synonyms that fit this exact context (empty array if none fit well).
- antonyms: up to 4 antonyms that fit this exact context (empty array if none apply).`
}

async function hashContext(sentence: string): Promise<string> {
  const normalized = sentence.trim().toLowerCase()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

interface DictionaryEntry {
  phonetic: string | null
  definitionEn: string | null
  partOfSpeech: string | null
}

interface RawDictionaryResponseEntry {
  phonetic?: string
  phonetics?: { text?: string }[]
  meanings?: { partOfSpeech?: string; definitions?: { definition?: string }[] }[]
}

// Best-effort, free, no key required — only meaningful for single words
// (skipped entirely for phrases, which it can't look up anyway). A short
// timeout keeps a slow/down dictionary API from delaying the more important
// Gemini result, since both are awaited together.
async function fetchDictionaryEntry(word: string): Promise<DictionaryEntry | null> {
  if (word.includes(' ')) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      signal: controller.signal,
    })
    if (!response.ok) return null

    const entries = (await response.json()) as RawDictionaryResponseEntry[]
    const first = entries[0]
    if (!first) return null

    const phonetic = first.phonetic || first.phonetics?.find((p) => p.text)?.text || null
    const firstMeaning = first.meanings?.[0]
    return {
      phonetic: phonetic ?? null,
      definitionEn: firstMeaning?.definitions?.[0]?.definition ?? null,
      partOfSpeech: firstMeaning?.partOfSpeech ?? null,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

interface LookupResult {
  definitionEn: string | null
  meaningVi: string | null
  partOfSpeech: string | null
  wordType: string | null
  cefrLevel: string | null
  synonyms: string[]
  antonyms: string[]
  phonetic: string | null
}

function emptyResult(): LookupResult {
  return {
    definitionEn: null,
    meaningVi: null,
    partOfSpeech: null,
    wordType: null,
    cefrLevel: null,
    synonyms: [],
    antonyms: [],
    phonetic: null,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const word = typeof body?.word === 'string' ? body.word.trim() : ''
    const sentence = typeof body?.sentence === 'string' ? body.sentence.trim() : ''
    if (!word || !sentence) {
      return new Response(JSON.stringify({ error: 'Body must include non-empty "word" and "sentence"' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const wordNormalized = word.toLowerCase()
    const contextHash = await hashContext(sentence)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: cached, error: cacheReadError } = await supabase
      .from('word_lookups')
      .select('*')
      .eq('word_normalized', wordNormalized)
      .eq('context_hash', contextHash)
      .maybeSingle()
    if (cacheReadError) console.error('word_lookups read failed:', cacheReadError)

    if (cached) {
      const result: LookupResult = {
        definitionEn: cached.definition_en,
        meaningVi: cached.meaning_vi,
        partOfSpeech: cached.part_of_speech,
        wordType: cached.word_type,
        cefrLevel: cached.cefr_level,
        synonyms: cached.synonyms ?? [],
        antonyms: cached.antonyms ?? [],
        phonetic: cached.phonetic,
      }
      return new Response(JSON.stringify({ ...result, source: 'cache' }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const [geminiOutcome, dictionaryEntry] = await Promise.all([
      (async () => {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: [{ role: 'user', parts: [{ text: buildPrompt(word, sentence) }] }],
          config: { responseMimeType: 'application/json', responseSchema: LOOKUP_SCHEMA },
        })
        const rawText = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text
        if (!rawText) throw new Error('Gemini returned an empty response')
        return JSON.parse(rawText)
      })().then(
        (value) => ({ ok: true as const, value }),
        (error) => ({ ok: false as const, error }),
      ),
      fetchDictionaryEntry(word),
    ])

    if (geminiOutcome.ok) {
      const parsed = geminiOutcome.value
      const result: LookupResult = {
        definitionEn: parsed.definitionEn ?? null,
        meaningVi: parsed.meaningVi ?? null,
        partOfSpeech: parsed.partOfSpeech ?? null,
        wordType: parsed.wordType ?? null,
        cefrLevel: parsed.cefrLevel ?? null,
        synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
        antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
        phonetic: dictionaryEntry?.phonetic ?? null,
      }

      // Only Gemini-sourced results are cached — a dictionary-only degraded
      // fallback (below) must NOT poison the cache, so a future request
      // retries Gemini once it recovers instead of being stuck forever.
      const { error: upsertError } = await supabase.from('word_lookups').upsert(
        {
          word_normalized: wordNormalized,
          context_hash: contextHash,
          definition_en: result.definitionEn,
          meaning_vi: result.meaningVi,
          part_of_speech: result.partOfSpeech,
          word_type: result.wordType,
          cefr_level: result.cefrLevel,
          synonyms: result.synonyms,
          antonyms: result.antonyms,
          phonetic: result.phonetic,
        },
        { onConflict: 'word_normalized,context_hash' },
      )
      if (upsertError) console.error('word_lookups upsert failed:', upsertError)

      return new Response(JSON.stringify({ ...result, source: 'gemini' }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Gemini failed (quota/network/parse error) — degrade to a dictionary-only
    // result if we have one, rather than blocking Save entirely. The client
    // still lets the learner fill in whatever's missing by hand.
    if (dictionaryEntry) {
      const result: LookupResult = { ...emptyResult(), ...dictionaryEntry }
      return new Response(JSON.stringify({ ...result, source: 'dictionary_fallback' }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: String(geminiOutcome.error) }), {
      status: 502,
      headers: CORS_HEADERS,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
