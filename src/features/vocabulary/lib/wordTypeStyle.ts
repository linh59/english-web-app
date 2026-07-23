import type { VocabularyCefrLevel, VocabularyWordType } from '@/features/vocabulary/types'

// Semantic multi-hue color-coding — single mapping point from DB enum to
// design token, shared by VocabularyCard and VocabularyFields so the two
// places that render these badges never drift out of sync (see decisions.md).
export const WORD_TYPE_CLASS: Record<VocabularyWordType, string> = {
  single_word: 'border-transparent bg-word-single-word/10 text-word-single-word',
  phrasal_verb: 'border-transparent bg-word-phrasal-verb/10 text-word-phrasal-verb',
  collocation: 'border-transparent bg-word-collocation/10 text-word-collocation',
  idiom: 'border-transparent bg-word-idiom/10 text-word-idiom',
  phrase: 'border-transparent bg-word-phrase/10 text-word-phrase',
}

export const CEFR_CLASS: Record<VocabularyCefrLevel, string> = {
  A1: 'border-transparent bg-cefr-a1 text-cefr-a1-foreground',
  A2: 'border-transparent bg-cefr-a2 text-cefr-a2-foreground',
  B1: 'border-transparent bg-cefr-b1 text-cefr-b1-foreground',
  B2: 'border-transparent bg-cefr-b2 text-cefr-b2-foreground',
  C1: 'border-transparent bg-cefr-c1 text-cefr-c1-foreground',
  C2: 'border-transparent bg-cefr-c2 text-cefr-c2-foreground',
}
