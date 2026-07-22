<script setup lang="ts">
import { Volume2 } from '@lucide/vue'

const SPACING = [
  { token: '1', class: 'w-1' },
  { token: '2', class: 'w-2' },
  { token: '3', class: 'w-3' },
  { token: '4', class: 'w-4' },
  { token: '6', class: 'w-6' },
  { token: '8', class: 'w-8' },
  { token: '12', class: 'w-12' },
  { token: '16', class: 'w-16' },
]
const RADII = [
  { token: 'sm', class: 'rounded-sm' },
  { token: 'md', class: 'rounded-md' },
  { token: 'lg', class: 'rounded-lg' },
  { token: 'xl', class: 'rounded-xl' },
  { token: 'full', class: 'rounded-full' },
]
const SHADOWS = ['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg']
const ICON_SIZES = ['size-3.5', 'size-4', 'size-5', 'size-6']
const Z_INDEX = [
  { name: 'z-dropdown', value: 1000 },
  { name: 'z-popover', value: 1100 },
  { name: 'z-modal', value: 1200 },
  { name: 'z-toast', value: 1300 },
]
</script>

<template>
  <div class="space-y-8">
    <div>
      <p class="mb-2 text-sm font-medium text-foreground">Spacing (Tailwind default scale)</p>
      <div class="flex flex-wrap items-end gap-2">
        <div v-for="s in SPACING" :key="s.token" class="flex flex-col items-center gap-1">
          <div class="h-4 bg-primary" :class="s.class" />
          <span class="font-mono text-xs text-muted-foreground">{{ s.token }}</span>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-sm font-medium text-foreground">Radius</p>
      <div class="flex flex-wrap gap-3">
        <div v-for="r in RADII" :key="r.token" class="flex flex-col items-center gap-1">
          <div class="size-12 border border-border bg-muted" :class="r.class" />
          <span class="font-mono text-xs text-muted-foreground">radius-{{ r.token }}</span>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-sm font-medium text-foreground">Shadow</p>
      <div class="flex flex-wrap gap-4">
        <div v-for="s in SHADOWS" :key="s" class="flex flex-col items-center gap-1">
          <div class="size-12 rounded-md bg-card" :class="s" />
          <span class="font-mono text-xs text-muted-foreground">{{ s }}</span>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-sm font-medium text-foreground">Icon size</p>
      <div class="flex items-end gap-4">
        <div v-for="s in ICON_SIZES" :key="s" class="flex flex-col items-center gap-1">
          <Volume2 :class="s" class="text-foreground" />
          <span class="font-mono text-xs text-muted-foreground">{{ s }}</span>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-sm font-medium text-foreground">Animation (hover to preview ease-smooth)</p>
      <div class="group h-10 w-40 rounded-md bg-muted">
        <div class="size-10 translate-x-0 rounded-md bg-primary transition-transform duration-300 ease-smooth group-hover:translate-x-28" />
      </div>
    </div>

    <div>
      <p class="mb-2 text-sm font-medium text-foreground">Z-index scale</p>
      <ul class="space-y-1 font-mono text-xs text-muted-foreground">
        <li v-for="z in Z_INDEX" :key="z.name">{{ z.name }}: {{ z.value }}</li>
      </ul>
    </div>
  </div>
</template>
