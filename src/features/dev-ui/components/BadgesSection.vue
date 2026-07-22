<script setup lang="ts">
import { Badge } from '@/shared/components/ui/badge'

const BADGES: { label: string, variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary' }[] = [
  { label: 'New', variant: 'default' },
  { label: 'Done', variant: 'success' },
  { label: 'Processing', variant: 'warning' },
  { label: 'Failed', variant: 'destructive' },
  { label: 'Info', variant: 'info' },
  { label: 'Secondary', variant: 'secondary' },
]
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <Badge v-for="b in BADGES" :key="b.label" :variant="b.variant">{{ b.label }}</Badge>
  </div>
</template>
