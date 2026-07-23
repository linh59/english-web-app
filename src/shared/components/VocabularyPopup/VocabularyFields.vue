<script setup lang="ts">
import type { VocabularyCefrLevel, VocabularyWordType } from '@/features/vocabulary/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CEFR_CLASS, WORD_TYPE_CLASS } from '@/features/vocabulary/lib/wordTypeStyle'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Switch } from '@/shared/components/ui/switch'
import { Textarea } from '@/shared/components/ui/textarea'

// Shared field layout for both the floating "Add" popup (VocabularyPopup,
// anchored over a transcript selection) and the "Edit" dialog on
// VocabularyPage — same fields, two different containers/positioning, so
// only this presentational part is reused (see checklist.md: no premature
// abstraction beyond what's actually shared).
const props = withDefaults(
  defineProps<{
    word: string
    exampleSentence: string
    loading?: boolean
    meaning: string
    definitionEn: string
    phonetic?: string | null
    partOfSpeech?: string | null
    wordType?: string | null
    cefrLevel?: string | null
    synonyms?: string[]
    antonyms?: string[]
  }>(),
  { loading: false, synonyms: () => [], antonyms: () => [] },
)

const emit = defineEmits<{
  'update:meaning': [value: string]
  'update:definitionEn': [value: string]
}>()

const { t } = useI18n({ useScope: 'global' })

// Vietnamese meaning is a supplement to the English definition (Comprehensible
// Input philosophy: think in English first), so it's togglable — same
// persisted-preference pattern as the sentence translation toggle in
// LessonStudyPage (showTranslation), defaulting to ON.
const SHOW_MEANING_VI_STORAGE_KEY = 'vocabularyShowMeaningVi'
const showMeaningVi = ref(localStorage.getItem(SHOW_MEANING_VI_STORAGE_KEY) !== 'false')
function setShowMeaningVi(value: boolean) {
  showMeaningVi.value = value
  localStorage.setItem(SHOW_MEANING_VI_STORAGE_KEY, String(value))
}

const wordTypeLabel = computed(() => {
  switch (props.wordType) {
    case 'single_word':
      return t('vocabulary.wordType.singleWord')
    case 'phrasal_verb':
      return t('vocabulary.wordType.phrasalVerb')
    case 'idiom':
      return t('vocabulary.wordType.idiom')
    case 'collocation':
      return t('vocabulary.wordType.collocation')
    case 'phrase':
      return t('vocabulary.wordType.phrase')
    default:
      return null
  }
})
</script>

<template>
  <div>
    <p class="text-sm font-semibold text-foreground">
      {{ word }}
      <span v-if="phonetic" class="ml-1 font-normal text-muted-foreground">/{{ phonetic }}/</span>
    </p>
    <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">"{{ exampleSentence }}"</p>

    <div v-if="loading" class="mt-2 space-y-2">
      <Skeleton class="h-4 w-1/3" />
      <Skeleton class="h-14 w-full" />
    </div>

    <template v-else>
      <div v-if="wordTypeLabel || cefrLevel" class="mt-2 flex flex-wrap gap-1">
        <Badge v-if="wordTypeLabel" :class="WORD_TYPE_CLASS[wordType as VocabularyWordType]">
          {{ wordTypeLabel }}
        </Badge>
        <Badge v-if="cefrLevel" :class="CEFR_CLASS[cefrLevel as VocabularyCefrLevel]">
          {{ cefrLevel }}
        </Badge>
      </div>

      <label class="mt-2 block text-xs font-medium text-muted-foreground">
        {{ t('vocabulary.popup.definitionEn') }}
      </label>
      <Textarea
        :model-value="definitionEn"
        class="mt-1 min-h-14 text-sm"
        @update:model-value="emit('update:definitionEn', String($event))"
      />

      <label class="mt-2 flex cursor-pointer items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{{ t('vocabulary.popup.meaningVi') }}</span>
        <Switch size="sm" :model-value="showMeaningVi" @update:model-value="setShowMeaningVi" />
      </label>
      <Textarea
        v-if="showMeaningVi"
        :model-value="meaning"
        class="mt-1 min-h-14 text-sm"
        @update:model-value="emit('update:meaning', String($event))"
      />

      <div v-if="synonyms.length" class="mt-2">
        <p class="text-xs font-medium text-muted-foreground">{{ t('vocabulary.popup.synonyms') }}</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <Badge v-for="synonym in synonyms" :key="synonym" variant="outline">{{ synonym }}</Badge>
        </div>
      </div>
      <div v-if="antonyms.length" class="mt-2">
        <p class="text-xs font-medium text-muted-foreground">{{ t('vocabulary.popup.antonyms') }}</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <Badge v-for="antonym in antonyms" :key="antonym" variant="outline">{{ antonym }}</Badge>
        </div>
      </div>
    </template>
  </div>
</template>
