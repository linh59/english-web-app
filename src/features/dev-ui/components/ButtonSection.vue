<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { Button } from '@/shared/components/ui/button'

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-3">
      <Button v-for="v in VARIANTS" :key="v" :variant="v">{{ v }}</Button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Plus /></Button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  </div>
</template>
