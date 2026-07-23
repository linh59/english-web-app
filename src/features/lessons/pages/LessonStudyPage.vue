<script setup lang="ts">
import { Languages, LocateFixed } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useVocabularyStore } from '@/features/vocabulary/stores/vocabulary.store'
import Transcript from '@/shared/components/Transcript/Transcript.vue'
import type { VocabularySaveInput } from '@/shared/components/Transcript/types'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Switch } from '@/shared/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import LessonPlayerBar from '../components/LessonPlayerBar.vue'
import { useAutoFollowScroll } from '../composables/useAutoFollowScroll'
import { useLessonsStore } from '../stores/lessons.store'
import type { Lesson, LessonSentence } from '../types'

const props = defineProps<{ id: string }>()

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const lessonsStore = useLessonsStore()
const vocabularyStore = useVocabularyStore()

// Set when arriving from VocabularyCard's "listen again" button
// (?t=<seconds>) — seeks to that exact moment once the audio's metadata has
// loaded (seeking any earlier can silently no-op before duration is known).
// Takes priority over the resume position below (a deliberate jump beats a
// passive "where you left off").
const pendingSeekTime = computed(() => {
  const value = Number(route.query.t)
  return Number.isFinite(value) ? value : null
})

// Below this, resuming isn't worth a jump — the learner is basically at the
// very start of the lesson anyway.
const MIN_RESUME_SECONDS = 3

function handleAudioReady() {
  if (pendingSeekTime.value !== null) {
    playerBarRef.value?.seekTo(pendingSeekTime.value)
    return
  }
  const savedPosition = lesson.value?.lastPositionSeconds
  if (savedPosition && savedPosition > MIN_RESUME_SECONDS) {
    playerBarRef.value?.seekTo(savedPosition)
  }
}

const lesson = ref<Lesson | null>(null)
const sentences = ref<LessonSentence[]>([])
const audioUrl = ref('')
const loading = ref(true)
const playerBarRef = ref<InstanceType<typeof LessonPlayerBar>>()
const isPlaying = ref(false)
const bottomBarHeight = ref(0)
const currentTime = ref(0)

// Defaults to ON (learners see the translation right away); persisted the same
// way as theme/locale (see useTheme.ts, i18n.ts) so the choice survives reloads.
const SHOW_TRANSLATION_STORAGE_KEY = 'showTranslation'
const showTranslation = ref(localStorage.getItem(SHOW_TRANSLATION_STORAGE_KEY) !== 'false')
function setShowTranslation(value: boolean) {
  showTranslation.value = value
  localStorage.setItem(SHOW_TRANSLATION_STORAGE_KEY, String(value))
}

const activeSentenceId = computed(
  () => sentences.value.find((s) => currentTime.value >= s.startTime && currentTime.value < s.endTime)?.id,
)
const activeIndex = computed(() => sentences.value.findIndex((s) => s.id === activeSentenceId.value))
const counterText = computed(() =>
  activeIndex.value >= 0
    ? t('common.transcript.sentenceCounter', { current: activeIndex.value + 1, total: sentences.value.length })
    : t('common.transcript.sentenceCountTotal', { total: sentences.value.length }),
)

const stickyRef = ref<HTMLElement>()
const { autoFollow, jumpToActive } = useAutoFollowScroll(activeSentenceId, stickyRef)

// --- Playback position persistence ----------------------------------------
// No single event reliably fires when a learner "leaves": they might navigate
// away in-app (unmount), pause, background the tab / lock the screen
// (visibilitychange), or close the tab outright (pagehide). Flush on all of
// them — the interval below is only a background safety net while playing,
// since most real exits happen through one of the explicit triggers instead.
let positionFlushInterval: number | undefined

function flushPosition() {
  if (!lesson.value || currentTime.value <= 0) return
  lessonsStore.updateLastPosition(lesson.value.id, currentTime.value)
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') flushPosition()
}

onMounted(async () => {
  loading.value = true
  lesson.value = await lessonsStore.fetchLessonById(props.id)
  if (lesson.value.status === 'done') {
    sentences.value = await lessonsStore.fetchLessonSentences(props.id)
  }
  audioUrl.value = await lessonsStore.getAudioSignedUrl(lesson.value.audioPath)
  loading.value = false
})

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function handleKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (isTypingTarget(event.target)) return

  if (event.code === 'Space') {
    event.preventDefault()
    playerBarRef.value?.togglePlay()
    return
  }

  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    if (!sentences.value.length) return
    event.preventDefault()
    const currentIndex = sentences.value.findIndex((s) => s.id === activeSentenceId.value)
    const targetIndex =
      currentIndex === -1
        ? 0
        : event.code === 'ArrowRight'
          ? Math.min(sentences.value.length - 1, currentIndex + 1)
          : Math.max(0, currentIndex - 1)
    playerBarRef.value?.seekTo(sentences.value[targetIndex].startTime)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', flushPosition)
  positionFlushInterval = window.setInterval(() => {
    if (isPlaying.value) flushPosition()
  }, 5000)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pagehide', flushPosition)
  window.clearInterval(positionFlushInterval)
  flushPosition()
})

function handleSentenceClick(sentenceId: string) {
  const sentence = sentences.value.find((s) => s.id === sentenceId)
  if (sentence) playerBarRef.value?.seekTo(sentence.startTime)
}

function handleSaveVocabulary(payload: VocabularySaveInput) {
  vocabularyStore.saveVocabulary({
    word: payload.word,
    meaning: payload.meaning,
    definitionEn: payload.definitionEn,
    exampleSentence: payload.exampleSentence,
    lessonId: props.id,
    startTime: payload.startTime,
    endTime: payload.endTime,
    partOfSpeech: payload.partOfSpeech,
    wordType: payload.wordType,
    cefrLevel: payload.cefrLevel,
    synonyms: payload.synonyms,
    antonyms: payload.antonyms,
  })
}
</script>

<template>
  <div>
    <div
      class="mx-auto max-w-3xl space-y-6 p-4 sm:p-8"
      :style="lesson ? { paddingBottom: `${bottomBarHeight + 16}px` } : undefined"
    >
      <Skeleton v-if="loading" class="h-64 w-full" />

      <template v-else-if="lesson">
        <h1 class="text-lg font-semibold text-foreground">{{ lesson.title }}</h1>

        <div
          v-if="lesson.status === 'done'"
          ref="stickyRef"
          class="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm sm:-mx-8 sm:px-8"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
          >
            <span class="whitespace-nowrap">{{ counterText }}</span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <label class="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
                    <Languages class="size-3.5" :class="showTranslation ? 'text-primary' : 'text-muted-foreground'" />
                    <span>{{ t('common.transcript.showTranslation') }}</span>
                    <Switch size="sm" :model-value="showTranslation" @update:model-value="setShowTranslation" />
                  </label>
                </TooltipTrigger>
                <TooltipContent>{{ t('common.transcript.showTranslationHint') }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <p v-if="lesson.status !== 'done'" class="text-sm text-muted-foreground">
          {{ t('lessons.study.processing') }}
        </p>
        <Transcript
          v-else
          :sentences="sentences"
          :active-sentence-id="activeSentenceId"
          :show-translation="showTranslation"
          @sentence-click="handleSentenceClick"
          @save-vocabulary="handleSaveVocabulary"
        />
      </template>
    </div>

    <TooltipProvider v-if="!autoFollow">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="fixed right-4 z-30 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            :style="{ bottom: `${bottomBarHeight + 16}px` }"
            :aria-label="t('common.transcript.backToActive')"
            @click="jumpToActive"
          >
            <LocateFixed class="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{{ t('common.transcript.backToActiveHint') }}</TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <LessonPlayerBar
      v-if="lesson"
      ref="playerBarRef"
      :src="audioUrl"
      @timeupdate="currentTime = $event"
      @loadedmetadata="handleAudioReady"
      @play="isPlaying = true"
      @pause="isPlaying = false; flushPosition()"
      @heightchange="bottomBarHeight = $event"
    />
  </div>
</template>
