<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { onMounted, onUnmounted, ref } from 'vue'
import VocabularyPopup from '../VocabularyPopup/VocabularyPopup.vue'
import SelectedTextToolbar from './SelectedTextToolbar.vue'
import TranscriptSentence from './TranscriptSentence.vue'
import type { TranscriptSentenceData, VocabularySaveInput } from './types'

// Matches Tailwind's `sm` breakpoint. Below it, selecting text is already a
// deliberate long-press-and-drag gesture, so the intermediate "Save" toolbar
// step is skipped — the full popup (rendered as a bottom sheet, see
// VocabularyPopup.vue) opens directly.
const isDesktop = useMediaQuery('(min-width: 640px)')

const props = defineProps<{
  sentences: TranscriptSentenceData[]
  activeSentenceId?: string
  showTranslation?: boolean
}>()

const emit = defineEmits<{
  'sentence-click': [id: string]
  'save-vocabulary': [payload: VocabularySaveInput]
}>()

const containerEl = ref<HTMLElement>()
const selection = ref<{
  text: string
  sentenceText: string
  sentenceId?: string
  startTime?: number
  endTime?: number
  top: number
  left: number
} | null>(null)
const showPopup = ref(false)

function findSentenceId(node: Node | null): string | undefined {
  let el = node instanceof Element ? node : node?.parentElement ?? null
  while (el && !(el instanceof HTMLElement && el.dataset.sentenceId)) {
    el = el.parentElement
  }
  return el instanceof HTMLElement ? el.dataset.sentenceId : undefined
}

function onMouseUp() {
  const sel = window.getSelection()
  const text = sel?.toString().trim()
  if (!sel || !text || sel.rangeCount === 0) {
    return
  }

  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const containerRect = containerEl.value!.getBoundingClientRect()
  const sentenceId = findSentenceId(range.startContainer)
  const sentence = props.sentences.find((s) => s.id === sentenceId)

  selection.value = {
    text,
    sentenceText: sentence?.text ?? text,
    sentenceId: sentence?.id,
    startTime: sentence?.startTime,
    endTime: sentence?.endTime,
    top: rect.top - containerRect.top,
    left: rect.left - containerRect.left + rect.width / 2,
  }
  // Desktop keeps the 2-step "Save" toolbar → popup flow; mobile opens the
  // popup directly since selecting text there is already a deliberate action.
  showPopup.value = !isDesktop.value
}

function onDocumentPointerDown(event: Event) {
  if (!containerEl.value?.contains(event.target as Node)) {
    selection.value = null
    showPopup.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('touchstart', onDocumentPointerDown)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('touchstart', onDocumentPointerDown)
})

function handleSentenceClick(id: string) {
  // A double-click to select a word also fires a click event on the sentence.
  // Ignore it so seeking doesn't clobber the selection the user just made.
  const hasActiveSelection = (window.getSelection()?.toString().trim().length ?? 0) > 0
  if (hasActiveSelection) return

  selection.value = null
  showPopup.value = false
  emit('sentence-click', id)
}

function handleSave(payload: VocabularySaveInput) {
  emit('save-vocabulary', payload)
  selection.value = null
  showPopup.value = false
}

function cancelPopup() {
  selection.value = null
  showPopup.value = false
}
</script>

<template>
  <div ref="containerEl" class="relative mx-auto max-w-[70ch]" @mouseup="onMouseUp" @touchend="onMouseUp">
    <TranscriptSentence
      v-for="sentence in sentences"
      :key="sentence.id"
      :sentence-id="sentence.id"
      :text="sentence.text"
      :is-active="sentence.id === activeSentenceId"
      :translation="sentence.translation"
      :show-translation="showTranslation ?? false"
      @click="handleSentenceClick(sentence.id)"
    />

    <SelectedTextToolbar
      v-if="selection && !showPopup"
      :top="selection.top"
      :left="selection.left"
      @save="showPopup = true"
    />

    <VocabularyPopup
      v-if="selection && showPopup"
      :word="selection.text"
      :example-sentence="selection.sentenceText"
      :sentence-id="selection.sentenceId"
      :start-time="selection.startTime"
      :end-time="selection.endTime"
      :top="selection.top"
      :left="selection.left"
      @save="handleSave"
      @cancel="cancelPopup"
    />
  </div>
</template>
