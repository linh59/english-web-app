<script setup lang="ts">
defineProps<{
  sentenceId: string
  text: string
  isActive: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <p
    :data-sentence-id="sentenceId"
    :aria-current="isActive ? 'true' : undefined"
    class="cursor-pointer rounded-md border-l-2 py-1.5 pl-3 pr-2 text-base leading-loose transition-colors duration-150 sm:text-lg"
    :class="
      isActive
        ? 'border-primary bg-primary/5 font-medium text-foreground'
        : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
    "
    @click="$emit('click')"
  >
    {{ text }}
  </p>
</template>
