<script setup lang="ts">
import { Skeleton } from '@/shared/components/ui/skeleton'
import Spinner from '@/shared/components/Spinner/Spinner.vue'
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
    <div class="max-w-sm space-y-2">
      <Skeleton class="h-4 w-2/3" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-20 w-full" />
    </div>
  </div>
</template>
