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

// Vocabulary-specific semantic tokens (see decisions.md — Semantic Multi-hue
// experiment): category color-coding by wordType + a sequential CEFR scale.
const WORD_TYPE_COLORS = [
  { label: 'Word: single_word', token: '--word-single-word' },
  { label: 'Word: phrasal_verb', token: '--word-phrasal-verb' },
  { label: 'Word: collocation', token: '--word-collocation' },
  { label: 'Word: idiom', token: '--word-idiom' },
  { label: 'Word: phrase', token: '--word-phrase' },
]

const CEFR_COLORS = [
  { label: 'CEFR A1', token: '--cefr-a1' },
  { label: 'CEFR A2', token: '--cefr-a2' },
  { label: 'CEFR B1', token: '--cefr-b1' },
  { label: 'CEFR B2', token: '--cefr-b2' },
  { label: 'CEFR C1', token: '--cefr-c1' },
  { label: 'CEFR C2', token: '--cefr-c2' },
]

const { theme } = useTheme()
const values = ref<Record<string, string>>({})

const ALL_TOKENS = [...COLORS, ...WORD_TYPE_COLORS, ...CEFR_COLORS]

function readValues() {
  const styles = getComputedStyle(document.documentElement)
  const next: Record<string, string> = {}
  for (const color of ALL_TOKENS) {
    next[color.token] = styles.getPropertyValue(color.token).trim()
  }
  values.value = next
}

watch(theme, () => requestAnimationFrame(readValues), { immediate: true })

const colors = computed(() => COLORS.map((c) => ({ ...c, value: values.value[c.token] ?? '' })))
const wordTypeColors = computed(() => WORD_TYPE_COLORS.map((c) => ({ ...c, value: values.value[c.token] ?? '' })))
const cefrColors = computed(() => CEFR_COLORS.map((c) => ({ ...c, value: values.value[c.token] ?? '' })))
</script>

<template>
  <div class="space-y-6">
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

    <div>
      <p class="mb-2 text-sm font-medium text-foreground">
        Word type (category color-coding)
      </p>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div v-for="color in wordTypeColors" :key="color.token" class="space-y-1.5">
          <div
            class="h-14 w-full rounded-md border border-border"
            :style="{ backgroundColor: `var(${color.token})` }"
          />
          <p class="text-sm font-medium text-foreground">{{ color.label }}</p>
          <p class="font-mono text-xs text-muted-foreground">{{ color.token }}</p>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-sm font-medium text-foreground">
        CEFR level (sequential scale)
      </p>
      <div class="grid grid-cols-3 gap-4 sm:grid-cols-6">
        <div v-for="color in cefrColors" :key="color.token" class="space-y-1.5">
          <div
            class="h-14 w-full rounded-md border border-border"
            :style="{ backgroundColor: `var(${color.token})` }"
          />
          <p class="text-sm font-medium text-foreground">{{ color.label }}</p>
          <p class="font-mono text-xs text-muted-foreground">{{ color.token }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
