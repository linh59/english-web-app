<script setup lang="ts">
defineProps<{
  sectionId: string
  title: string
  description: string
}>()
</script>

<template>
  <section :id="sectionId" class="scroll-mt-20 space-y-4 border-b border-border pb-10">
    <div>
      <h2 class="text-lg font-semibold text-foreground">{{ title }}</h2>
      <p class="text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <div>
      <slot />
    </div>
  </section>
</template>
