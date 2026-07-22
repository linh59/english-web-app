import type { LessonStatus } from '@/shared/components/LessonCard/LessonCard.vue'

export interface Lesson {
  id: string
  title: string
  audioPath: string
  status: LessonStatus
  durationSeconds: number | null
  errorMessage: string | null
  processingStep: string | null
  createdAt: string
}

export interface LessonSentence {
  id: string
  sentenceIndex: number
  text: string
  startTime: number
  endTime: number
}
