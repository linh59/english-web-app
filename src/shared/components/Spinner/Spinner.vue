<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { cn } from '@/shared/lib/utils'

withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const sizeClass = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}
</script>

<template>
  <Loader2 :class="cn('animate-spin text-muted-foreground', sizeClass[size])" />
</template>
