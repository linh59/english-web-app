<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  label?: string
}>()

const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
</script>

<template>
  <div class="w-full">
    <div v-if="label" class="mb-1 flex justify-between text-xs text-muted-foreground">
      <span>{{ label }}</span>
      <span>{{ Math.round(clamped) }}%</span>
    </div>
    <div
      class="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      :aria-valuenow="clamped"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full rounded-full bg-primary transition-all duration-300 ease-smooth"
        :style="{ width: `${clamped}%` }"
      />
    </div>
  </div>
</template>
