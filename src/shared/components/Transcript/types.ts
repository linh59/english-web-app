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
  exampleSentence: string
}
