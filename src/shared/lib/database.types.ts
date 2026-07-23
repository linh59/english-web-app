import type { LessonStatus, TranslationStatus } from '@/shared/components/LessonCard/LessonCard.vue'

export interface LessonRow {
  id: string
  user_id: string
  title: string
  audio_path: string
  status: LessonStatus
  duration_seconds: number | null
  error_message: string | null
  processing_step: string | null
  translation_status: TranslationStatus
  last_position_seconds: number | null
  created_at: string
}

export interface LessonSentenceRow {
  id: string
  lesson_id: string
  sentence_index: number
  chunk_index: number
  text: string
  start_time: number
  end_time: number
}

export interface LessonSentenceTranslationRow {
  id: string
  sentence_id: string
  language: string
  translated_text: string
  created_at: string
}

export interface VocabularyRow {
  id: string
  user_id: string
  lesson_id: string | null
  word: string
  meaning: string | null
  definition_en: string | null
  example_sentence: string | null
  part_of_speech: string | null
  word_type: string | null
  cefr_level: string | null
  synonyms: string[] | null
  antonyms: string[] | null
  start_time: number | null
  end_time: number | null
  encounter_count: number
  created_at: string
  updated_at: string
}
