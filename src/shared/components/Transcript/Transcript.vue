<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import VocabularyPopup from '../VocabularyPopup/VocabularyPopup.vue'
import SelectedTextToolbar from './SelectedTextToolbar.vue'
import TranscriptSentence from './TranscriptSentence.vue'
import type { TranscriptSentenceData, VocabularySaveInput } from './types'

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

// selectionchange (rather than mouseup) is what actually detects a finished
// selection on both desktop (mouse drag) and mobile (dragging iOS/Android's
// native selection handles) — mobile touch selection doesn't reliably fire a
// synthetic mouseup on the element the way desktop click-drag does, which is
// why the Save toolbar never appeared on iPhone before this. Debounced so the
// toolbar only (re)computes once the selection has settled, not on every
// intermediate change while still dragging.
const SELECTION_SETTLE_MS = 200
let selectionChangeTimer: number | undefined

function computeSelectionState() {
  const sel = window.getSelection()
  const text = sel?.toString().trim()
  if (!sel || !text || sel.rangeCount === 0 || sel.isCollapsed) {
    selection.value = null
    showPopup.value = false
    return
  }

  const range = sel.getRangeAt(0)
  if (!containerEl.value?.contains(range.commonAncestorContainer)) {
    selection.value = null
    showPopup.value = false
    return
  }

  const rect = range.getBoundingClientRect()
  const containerRect = containerEl.value.getBoundingClientRect()
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
  showPopup.value = false
}

function onSelectionChange() {
  window.clearTimeout(selectionChangeTimer)
  selectionChangeTimer = window.setTimeout(computeSelectionState, SELECTION_SETTLE_MS)
}

function onDocumentPointerDown(event: MouseEvent | TouchEvent) {
  if (!containerEl.value?.contains(event.target as Node)) {
    selection.value = null
    showPopup.value = false
  }
}

onMounted(() => {
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('touchstart', onDocumentPointerDown)
})
onUnmounted(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('touchstart', onDocumentPointerDown)
  window.clearTimeout(selectionChangeTimer)
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
  <div ref="containerEl" class="relative mx-auto max-w-[70ch]">
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
