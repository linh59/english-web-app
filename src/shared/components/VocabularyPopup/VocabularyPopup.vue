<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVocabularyStore } from '@/features/vocabulary/stores/vocabulary.store'
import type { VocabularySaveInput } from '@/shared/components/Transcript/types'
import { Button } from '@/shared/components/ui/button'
import VocabularyFields from './VocabularyFields.vue'

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
  <div
    class="absolute z-popover w-72 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
    :style="{ top: `${top}px`, left: `${left}px` }"
    @mousedown.stop
    @mouseup.stop
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
    <div class="mt-2 flex justify-end gap-2">
      <Button variant="ghost" size="sm" @click="$emit('cancel')">{{ t('common.cancel') }}</Button>
      <Button size="sm" @click="handleSave">{{ t('common.save') }}</Button>
    </div>
  </div>
</template>
