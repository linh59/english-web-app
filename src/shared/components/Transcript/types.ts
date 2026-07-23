export interface TranscriptSentenceData {
  id: string
  text: string
  startTime: number
  endTime: number
  translation?: string | null
}

export interface VocabularySaveInput {
  word: string
  meaning: string
  definitionEn: string
  exampleSentence: string
  sentenceId?: string
  startTime?: number
  endTime?: number
  partOfSpeech: string | null
  wordType: string | null
  cefrLevel: string | null
  synonyms: string[]
  antonyms: string[]
}
