<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTheme } from '@/shared/composables/useTheme'

const COLORS = [
  { label: 'Primary', token: '--primary' },
  { label: 'Secondary', token: '--secondary' },
  { label: 'Accent', token: '--accent' },
  { label: 'Neutral', token: '--muted' },
  { label: 'Background', token: '--background' },
  { label: 'Surface', token: '--card' },
  { label: 'Success', token: '--success' },
  { label: 'Warning', token: '--warning' },
  { label: 'Danger', token: '--destructive' },
  { label: 'Information', token: '--info' },
  { label: 'Text', token: '--foreground' },
  { label: 'Border', token: '--border' },
]

const { theme } = useTheme()
const values = ref<Record<string, string>>({})

function readValues() {
  const styles = getComputedStyle(document.documentElement)
  const next: Record<string, string> = {}
  for (const color of COLORS) {
    next[color.token] = styles.getPropertyValue(color.token).trim()
  }
  values.value = next
}

watch(theme, () => requestAnimationFrame(readValues), { immediate: true })

const colors = computed(() => COLORS.map((c) => ({ ...c, value: values.value[c.token] ?? '' })))
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    <div v-for="color in colors" :key="color.token" class="space-y-1.5">
      <div
        class="h-14 w-full rounded-md border border-border"
        :style="{ backgroundColor: `var(${color.token})` }"
      />
      <p class="text-sm font-medium text-foreground">{{ color.label }}</p>
      <p class="font-mono text-xs text-muted-foreground">{{ color.token }}</p>
      <p class="font-mono text-xs text-muted-foreground">{{ color.value }}</p>
    </div>
  </div>
</template>
