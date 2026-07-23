<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVocabularyStore } from '@/features/vocabulary/stores/vocabulary.store'
import type { VocabularySaveInput } from '@/shared/components/Transcript/types'
import { Button } from '@/shared/components/ui/button'
import VocabularyFields from './VocabularyFields.vue'

// Matches Transcript.vue's breakpoint. Below it, this renders as a full-width
// bottom sheet instead of a small popover pinned to the selection's pixel
// coordinates — a fixed-width popover anchored that way can overflow narrow
// phone screens, and its buttons are too small for a comfortable tap target.
const isDesktop = useMediaQuery('(min-width: 640px)')

const props = defineProps<{
  word: string
  exampleSentence: string
  sentenceId?: string
  startTime?: number
  endTime?: number
  top: number
  left: number
}>()

const emit = defineEmits<{
  save: [payload: VocabularySaveInput]
  cancel: []
}>()

const { t } = useI18n({ useScope: 'global' })
const vocabularyStore = useVocabularyStore()

const loading = ref(true)
const meaning = ref('')
const definitionEn = ref('')
const phonetic = ref<string | null>(null)
const partOfSpeech = ref<string | null>(null)
const wordType = ref<string | null>(null)
const cefrLevel = ref<string | null>(null)
const synonyms = ref<string[]>([])
const antonyms = ref<string[]>([])

// Pixel coordinates only make sense for the desktop popover; the mobile
// bottom sheet is positioned entirely by CSS (fixed to the viewport edge).
const popoverStyle = computed(() => (isDesktop.value ? { top: `${props.top}px`, left: `${props.left}px` } : {}))

// Auto-fills meaning/definition from the lookup-word-meaning Edge Function
// (hybrid Gemini + dictionary, see its own comments). Never blocks Save on
// failure — the fields just stay empty and the learner types them by hand,
// same as the original manual-entry behavior.
onMounted(async () => {
  const result = await vocabularyStore.lookupWordMeaning(props.word, props.exampleSentence)
  if (result) {
    meaning.value = result.meaningVi ?? ''
    definitionEn.value = result.definitionEn ?? ''
    phonetic.value = result.phonetic
    partOfSpeech.value = result.partOfSpeech
    wordType.value = result.wordType
    cefrLevel.value = result.cefrLevel
    synonyms.value = result.synonyms
    antonyms.value = result.antonyms
  }
  loading.value = false
})

function handleSave() {
  emit('save', {
    word: props.word,
    meaning: meaning.value,
    definitionEn: definitionEn.value,
    exampleSentence: props.exampleSentence,
    sentenceId: props.sentenceId,
    startTime: props.startTime,
    endTime: props.endTime,
    partOfSpeech: partOfSpeech.value,
    wordType: wordType.value,
    cefrLevel: cefrLevel.value,
    synonyms: synonyms.value,
    antonyms: antonyms.value,
  })
}
</script>

<template>
  <div class="fixed inset-0 z-popover bg-black/40 sm:hidden" @click="$emit('cancel')" />

  <div
    class="fixed inset-x-0 bottom-0 z-popover max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-border bg-popover p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-popover-foreground shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:w-72 sm:max-h-none sm:-translate-x-1/2 sm:overflow-visible sm:rounded-lg sm:border sm:p-3 sm:pb-3"
    :style="popoverStyle"
    @mousedown.stop
    @mouseup.stop
    @touchstart.stop
    @touchend.stop
  >
    <VocabularyFields
      :word="word"
      :example-sentence="exampleSentence"
      :loading="loading"
      :meaning="meaning"
      :definition-en="definitionEn"
      :phonetic="phonetic"
      :part-of-speech="partOfSpeech"
      :word-type="wordType"
      :cefr-level="cefrLevel"
      :synonyms="synonyms"
      :antonyms="antonyms"
      @update:meaning="meaning = $event"
      @update:definition-en="definitionEn = $event"
    />
    <div class="mt-3 flex justify-end gap-2 sm:mt-2">
      <Button variant="ghost" class="h-11 flex-1 text-sm sm:h-6 sm:flex-none sm:text-xs/relaxed" @click="$emit('cancel')">
        {{ t('common.cancel') }}
      </Button>
      <Button class="h-11 flex-1 text-sm sm:h-6 sm:flex-none sm:text-xs/relaxed" @click="handleSave">
        {{ t('common.save') }}
      </Button>
    </div>
  </div>
</template>
