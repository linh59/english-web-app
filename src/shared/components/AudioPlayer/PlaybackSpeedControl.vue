<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const

defineProps<{
  speed: number
}>()

defineEmits<{
  'update:speed': [speed: number]
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      class="inline-flex h-6 items-center rounded-md px-1.5 text-xs font-medium transition-colors hover:bg-muted"
    >
      {{ speed }}x
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="option in SPEEDS"
        :key="option"
        :class="option === speed && 'font-semibold text-primary'"
        @click="$emit('update:speed', option)"
      >
        {{ option }}x
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
