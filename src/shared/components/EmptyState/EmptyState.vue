<script setup lang="ts">
import type { FunctionalComponent } from 'vue'

defineProps<{
  icon: FunctionalComponent
  title: string
  description?: string
  actionLabel?: string
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
    <component :is="icon" class="size-8 text-muted-foreground" />
    <div class="space-y-1">
      <p class="text-sm font-medium text-foreground">{{ title }}</p>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <button
      v-if="actionLabel"
      type="button"
      class="mt-2 text-sm font-medium text-primary hover:underline"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
