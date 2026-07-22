<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { Switch } from '@/shared/components/ui/switch'
import { useTheme } from '@/shared/composables/useTheme'

const { theme, toggleTheme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <Sun class="size-4 text-muted-foreground" />
    <Switch
      :model-value="isDark"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @update:model-value="toggleTheme"
    />
    <Moon class="size-4 text-muted-foreground" />
  </div>
</template>
