<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AudioPlayer from '@/shared/components/AudioPlayer/AudioPlayer.vue'

defineProps<{ src?: string }>()

const emit = defineEmits<{
  timeupdate: [currentTime: number]
  loadedmetadata: []
  play: []
  pause: []
  heightchange: [height: number]
}>()

const { t } = useI18n({ useScope: 'global' })
const rootRef = ref<HTMLElement>()
const audioPlayerRef = ref<InstanceType<typeof AudioPlayer>>()

// Reports its own height to the parent page so it can reserve enough bottom
// padding for the transcript and position the floating "back to active
// sentence" button just above this bar — re-observed (not just measured once
// on mount) since content-driven size changes (e.g. text wrapping at narrow
// widths) aren't caught by a single measurement.
let observer: ResizeObserver | undefined
function reportHeight() {
  if (rootRef.value) emit('heightchange', rootRef.value.getBoundingClientRect().height)
}
onMounted(() => {
  reportHeight()
  if (!rootRef.value) return
  observer = new ResizeObserver(reportHeight)
  observer.observe(rootRef.value)
})
onUnmounted(() => observer?.disconnect())

defineExpose({
  seekTo: (time: number) => audioPlayerRef.value?.seekTo(time),
  togglePlay: () => audioPlayerRef.value?.togglePlay(),
})
</script>

<template>
  <div ref="rootRef" class="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm">
    <div class="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 sm:px-8">
      <RouterLink
        to="/library"
        class="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
        :aria-label="t('common.audioPlayer.backToLibrary')"
      >
        <ChevronLeft class="size-5" />
      </RouterLink>
      <AudioPlayer
        ref="audioPlayerRef"
        class="min-w-0 flex-1"
        :src="src"
        @timeupdate="emit('timeupdate', $event)"
        @loadedmetadata="emit('loadedmetadata')"
        @play="emit('play')"
        @pause="emit('pause')"
      />
    </div>
  </div>
</template>
