export type VocabularyWordType = 'single_word' | 'phrasal_verb' | 'idiom' | 'collocation' | 'phrase'
export type VocabularyCefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface VocabularyItem {
  id: string
  word: string
  meaning: string
  definitionEn: string
  exampleSentence: string
  lessonId: string | null
  startTime: number | null
  endTime: number | null
  encounterCount: number
  partOfSpeech: string | null
  wordType: VocabularyWordType | null
  cefrLevel: VocabularyCefrLevel | null
  synonyms: string[]
  antonyms: string[]
  createdAt: string
  updatedAt: string
}

// Response shape of the lookup-word-meaning Edge Function.
export interface WordLookupResult {
  definitionEn: string | null
  meaningVi: string | null
  partOfSpeech: string | null
  wordType: VocabularyWordType | null
  cefrLevel: VocabularyCefrLevel | null
  synonyms: string[]
  antonyms: string[]
  phonetic: string | null
}
