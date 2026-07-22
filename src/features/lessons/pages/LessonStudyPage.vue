<script setup lang="ts">
import { LocateFixed } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVocabularyStore } from '@/features/vocabulary/stores/vocabulary.store'
import AudioPlayer from '@/shared/components/AudioPlayer/AudioPlayer.vue'
import Transcript from '@/shared/components/Transcript/Transcript.vue'
import type { VocabularySaveInput } from '@/shared/components/Transcript/types'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Switch } from '@/shared/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useLessonsStore } from '../stores/lessons.store'
import type { Lesson, LessonSentence } from '../types'

const props = defineProps<{ id: string }>()

const { t } = useI18n({ useScope: 'global' })
const lessonsStore = useLessonsStore()
const vocabularyStore = useVocabularyStore()

const lesson = ref<Lesson | null>(null)
const sentences = ref<LessonSentence[]>([])
const audioUrl = ref('')
const loading = ref(true)
const audioPlayerRef = ref<InstanceType<typeof AudioPlayer>>()
const stickyRef = ref<HTMLElement>()
const stickyHeight = ref(0)
const currentTime = ref(0)
const autoFollow = ref(true)

let isProgrammaticScroll = false
let programmaticScrollTimer: number | undefined

const activeSentenceId = computed(
  () => sentences.value.find((s) => currentTime.value >= s.startTime && currentTime.value < s.endTime)?.id,
)
const activeIndex = computed(() => sentences.value.findIndex((s) => s.id === activeSentenceId.value))
const counterText = computed(() =>
  activeIndex.value >= 0
    ? t('common.transcript.sentenceCounter', { current: activeIndex.value + 1, total: sentences.value.length })
    : t('common.transcript.sentenceCountTotal', { total: sentences.value.length }),
)

onMounted(async () => {
  loading.value = true
  lesson.value = await lessonsStore.fetchLessonById(props.id)
  if (lesson.value.status === 'done') {
    sentences.value = await lessonsStore.fetchLessonSentences(props.id)
  }
  audioUrl.value = await lessonsStore.getAudioSignedUrl(lesson.value.audioPath)
  loading.value = false
})

function measureSticky() {
  stickyHeight.value = stickyRef.value?.getBoundingClientRect().height ?? 0
}

function scrollToSentence(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-sentence-id="${id}"]`)
  if (!el) return

  const rect = el.getBoundingClientRect()
  const viewportHeight = window.innerHeight - stickyHeight.value
  const targetY = stickyHeight.value + viewportHeight * 0.35
  const delta = rect.top - targetY
  if (Math.abs(delta) < 4) return

  isProgrammaticScroll = true
  window.scrollBy({ top: delta, behavior: 'smooth' })
  window.clearTimeout(programmaticScrollTimer)
  programmaticScrollTimer = window.setTimeout(() => {
    isProgrammaticScroll = false
  }, 600)
}

function onWindowScroll() {
  if (isProgrammaticScroll) return
  autoFollow.value = false
}

function jumpToActive() {
  autoFollow.value = true
  if (activeSentenceId.value) scrollToSentence(activeSentenceId.value)
}

watch(activeSentenceId, (id) => {
  if (id && autoFollow.value) scrollToSentence(id)
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
    audioPlayerRef.value?.togglePlay()
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
    audioPlayerRef.value?.seekTo(sentences.value[targetIndex].startTime)
  }
}

onMounted(() => {
  measureSticky()
  window.addEventListener('resize', measureSticky)
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('resize', measureSticky)
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('keydown', handleKeydown)
  window.clearTimeout(programmaticScrollTimer)
})

function handleSentenceClick(sentenceId: string) {
  const sentence = sentences.value.find((s) => s.id === sentenceId)
  if (sentence) audioPlayerRef.value?.seekTo(sentence.startTime)
}

function handleSaveVocabulary(payload: VocabularySaveInput) {
  vocabularyStore.saveVocabulary({ ...payload, lessonId: props.id })
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
    <Skeleton v-if="loading" class="h-64 w-full" />

    <template v-else-if="lesson">
      <h1 class="text-lg font-semibold text-foreground">{{ lesson.title }}</h1>

      <div
        ref="stickyRef"
        class="sticky top-0 z-20 -mx-4 space-y-2 bg-background/95 px-4 pb-3 pt-1 backdrop-blur-sm sm:-mx-8 sm:px-8"
      >
        <AudioPlayer ref="audioPlayerRef" :src="audioUrl" @timeupdate="currentTime = $event" />

        <div
          v-if="lesson.status === 'done'"
          class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
        >
          <span class="whitespace-nowrap">{{ counterText }}</span>

          <TooltipProvider>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Tooltip v-if="!autoFollow">
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 font-medium text-primary hover:bg-muted"
                    @click="jumpToActive"
                  >
                    <LocateFixed class="size-3.5" />
                    {{ t('common.transcript.backToActive') }}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{{ t('common.transcript.backToActiveHint') }}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <label class="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
                    <LocateFixed class="size-3.5" :class="autoFollow ? 'text-primary' : 'text-muted-foreground'" />
                    <span>{{ t('common.transcript.autoScroll') }}</span>
                    <Switch size="sm" :checked="autoFollow" @update:checked="autoFollow = $event" />
                  </label>
                </TooltipTrigger>
                <TooltipContent>{{ t('common.transcript.autoScrollHint') }}</TooltipContent>
              </Tooltip>
            </div>
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
        @sentence-click="handleSentenceClick"
        @save-vocabulary="handleSaveVocabulary"
      />
    </template>
  </div>
</template>
