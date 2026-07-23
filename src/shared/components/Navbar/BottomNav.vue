<script setup lang="ts">
import { BookmarkCheck, Headphones } from '@lucide/vue'
import type { Component } from 'vue'

defineProps<{
  links: { label: string, to: string }[]
}>()

// Only ever these 2 destinations (Library/Vocabulary) — a hardcoded lookup is
// simpler than threading icon data through the shared `links` prop that
// Navbar.vue also consumes.
const ICONS: Record<string, Component> = {
  '/library': Headphones,
  '/vocabulary': BookmarkCheck,
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden"
  >
    <RouterLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground"
      active-class="text-foreground font-medium"
    >
      <component :is="ICONS[link.to]" class="size-5" />
      {{ link.label }}
    </RouterLink>
  </nav>
</template>
