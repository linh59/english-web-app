<script setup lang="ts">
import { Repeat } from '@lucide/vue'
import { cn } from '@/shared/lib/utils'

defineProps<{
  active: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    type="button"
    class="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted"
    :class="cn(active && 'text-primary')"
    :aria-pressed="active"
    :title="active ? 'Loop on' : 'Loop off'"
    @click="$emit('toggle')"
  >
    <Repeat class="size-3.5" />
  </button>
</template>
