<script setup lang="ts">
defineProps<{
  sentenceId: string
  text: string
  isActive: boolean
  translation?: string | null
  showTranslation: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <div
    :data-sentence-id="sentenceId"
    :aria-current="isActive ? 'true' : undefined"
    class="cursor-pointer rounded-md border-l-2 py-1.5 pl-3 pr-2 transition-colors duration-150"
    :class="
      isActive
        ? 'border-primary bg-primary/5'
        : 'border-transparent hover:bg-muted'
    "
    @click="$emit('click')"
  >
    <p
      class="text-base leading-loose sm:text-lg"
      :class="isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'"
    >
      {{ text }}
    </p>
    <p v-if="isActive && showTranslation && translation" class="mt-1 text-sm italic leading-snug text-muted-foreground">
      {{ translation }}
    </p>
  </div>
</template>
