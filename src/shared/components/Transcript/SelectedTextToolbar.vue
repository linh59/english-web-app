<script setup lang="ts">
import { BookmarkPlus } from '@lucide/vue'

defineProps<{
  top: number
  left: number
}>()

defineEmits<{
  save: []
}>()
</script>

<template>
  <div
    class="absolute z-popover -translate-x-1/2 -translate-y-full"
    :style="{ top: `${top}px`, left: `${left}px` }"
    @mousedown.stop.prevent
    @mouseup.stop
    @touchstart.stop.prevent
  >
    <button
      type="button"
      class="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-md hover:bg-primary/90"
      @click="$emit('save')"
    >
      <BookmarkPlus class="size-3.5" />
      Save
    </button>
  </div>
</template>
