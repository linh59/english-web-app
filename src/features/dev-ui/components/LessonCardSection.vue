<script setup lang="ts">
import LessonCard from '@/shared/components/LessonCard/LessonCard.vue'
import type { LessonStatus } from '@/shared/components/LessonCard/LessonCard.vue'

const LESSONS: { title: string, durationSeconds: number, status: LessonStatus }[] = [
  { title: 'Everyday Conversations — Episode 12', durationSeconds: 4260, status: 'done' },
  { title: 'BBC Podcast — Climate Change', durationSeconds: 3600, status: 'processing' },
  { title: 'TED Talk — The Power of Vulnerability', durationSeconds: 1180, status: 'pending' },
  { title: 'News in Slow English — Jul 21', durationSeconds: 900, status: 'failed' },
]
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <LessonCard
      v-for="lesson in LESSONS"
      :key="lesson.title"
      :title="lesson.title"
      :duration-seconds="lesson.durationSeconds"
      :status="lesson.status"
    />
  </div>
</template>
