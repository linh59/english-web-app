<script setup lang="ts">
import { BookOpen, SearchX, Sparkles } from '@lucide/vue'
import EmptyState from '@/shared/components/EmptyState/EmptyState.vue'
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-3">
    <EmptyState
      :icon="Sparkles"
      title="No lessons yet"
      description="Upload an audio file to create your first lesson."
      action-label="Upload audio"
    />
    <EmptyState
      :icon="BookOpen"
      title="No vocabulary yet"
      description="Select a word or phrase while studying to save it here."
    />
    <EmptyState
      :icon="SearchX"
      title="No results"
      description="Try a different search term."
    />
  </div>
</template>
