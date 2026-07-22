export interface TranscriptSentenceData {
  id: string
  text: string
  startTime: number
  endTime: number
}

export interface VocabularySaveInput {
  word: string
  meaning: string
  exampleSentence: string
}
