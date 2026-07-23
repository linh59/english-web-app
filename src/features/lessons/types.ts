import type { LessonStatus, TranslationStatus } from '@/shared/components/LessonCard/LessonCard.vue'

export interface Lesson {
  id: string
  title: string
  audioPath: string
  status: LessonStatus
  durationSeconds: number | null
  errorMessage: string | null
  processingStep: string | null
  translationStatus: TranslationStatus
  lastPositionSeconds: number | null
  createdAt: string
}

export interface LessonSentence {
  id: string
  sentenceIndex: number
  text: string
  startTime: number
  endTime: number
  translation: string | null
}
