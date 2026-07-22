<script setup lang="ts">
import Progress from '@/shared/components/Progress/Progress.vue'
</script>

<template>
  <div class="max-w-md space-y-4">
    <Progress :value="18" label="Lesson progress" />
    <Progress :value="64" label="Lesson progress" />
    <Progress :value="100" label="Lesson progress" />
  </div>
</template>
