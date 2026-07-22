<script setup lang="ts">
const SPECIMENS = [
  { name: 'Display', class: 'text-4xl font-bold tracking-tight' },
  { name: 'Heading', class: 'text-2xl font-semibold tracking-tight' },
  { name: 'Title', class: 'text-xl font-semibold' },
  { name: 'Subtitle', class: 'text-lg font-medium' },
  { name: 'Body', class: 'text-sm font-normal' },
  { name: 'Small', class: 'text-xs font-normal' },
  { name: 'Caption', class: 'text-xs text-muted-foreground' },
  { name: 'Label', class: 'text-sm font-medium' },
]
</script>

<template>
  <div class="space-y-4">
    <div v-for="s in SPECIMENS" :key="s.name" class="flex items-baseline gap-4 border-b border-border pb-3">
      <span class="w-20 shrink-0 font-mono text-xs text-muted-foreground">{{ s.name }}</span>
      <span :class="s.class" class="text-foreground">The quick brown fox jumps over the lazy dog</span>
    </div>
    <div class="flex items-baseline gap-4">
      <span class="w-20 shrink-0 font-mono text-xs text-muted-foreground">Code</span>
      <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">const hello = "world"</code>
    </div>
  </div>
</template>
