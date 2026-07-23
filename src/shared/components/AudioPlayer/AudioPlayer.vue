<script setup lang="ts">
import { Pause, Play } from '@lucide/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDuration } from '@/shared/lib/format'
import LoopButton from './LoopButton.vue'
import PlaybackSpeedControl from './PlaybackSpeedControl.vue'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps<{
  src?: string
  title?: string
}>()

const emit = defineEmits<{
  timeupdate: [currentTime: number]
  loadedmetadata: []
  play: []
  pause: []
}>()

const audioEl = ref<HTMLAudioElement>()
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const speed = ref(1)
const loop = ref(false)

function togglePlay() {
  if (!audioEl.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
  } else {
    audioEl.value.play()
  }
}

function onPlay() {
  isPlaying.value = true
  emit('play')
}

function onPause() {
  isPlaying.value = false
  emit('pause')
}

function onTimeUpdate() {
  if (!audioEl.value) return
  currentTime.value = audioEl.value.currentTime
  emit('timeupdate', currentTime.value)
}

function onLoadedMetadata() {
  if (!audioEl.value) return
  duration.value = audioEl.value.duration
  emit('loadedmetadata')
}

function onSeek(event: Event) {
  if (!audioEl.value) return
  const value = Number((event.target as HTMLInputElement).value)
  audioEl.value.currentTime = value
  currentTime.value = value
}

function setSpeed(value: number) {
  speed.value = value
  if (audioEl.value) audioEl.value.playbackRate = value
}

function seekTo(time: number) {
  if (!audioEl.value) return
  audioEl.value.currentTime = time
  currentTime.value = time
}

defineExpose({ seekTo, togglePlay, currentTime, duration, isPlaying })
</script>

<template>
  <div class="rounded-lg border border-border bg-card p-1.5">
    <audio
      ref="audioEl"
      :src="props.src"
      :loop="loop"
      class="hidden"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
    />

    <p v-if="title" class="mb-1 truncate text-xs font-medium text-foreground">{{ title }}</p>

    <input
      type="range"
      class="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--primary)]"
      :min="0"
      :max="duration || 0"
      :value="currentTime"
      @input="onSeek"
    />

    <div class="mt-0.5 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/80"
          :aria-label="isPlaying ? t('common.audioPlayer.pause') : t('common.audioPlayer.play')"
          @click="togglePlay"
        >
          <Pause v-if="isPlaying" class="size-3.5" />
          <Play v-else class="size-3.5" />
        </button>
        <span class="text-xs tabular-nums text-muted-foreground">
          {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <PlaybackSpeedControl :speed="speed" @update:speed="setSpeed" />
        <LoopButton :active="loop" @toggle="loop = !loop" />
      </div>
    </div>
  </div>
</template>
