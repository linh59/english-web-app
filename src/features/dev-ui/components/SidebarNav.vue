<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Input } from '@/shared/components/ui/input'

const props = defineProps<{
  sections: { id: string, title: string }[]
  searchPlaceholder: string
  noResultsLabel: string
}>()

const query = ref('')
const collapsed = ref(window.matchMedia('(max-width: 639px)').matches)

const filtered = computed(() =>
  props.sections.filter((s) => s.title.toLowerCase().includes(query.value.toLowerCase())),
)

function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-modal border-r border-border bg-background transition-all duration-300 ease-smooth sm:static sm:inset-auto sm:z-auto sm:shrink-0"
    :class="collapsed ? 'w-0 overflow-hidden' : 'w-56 shadow-lg sm:shadow-none'"
  >
    <div class="sticky top-0 flex h-[calc(100vh-3.5rem)] flex-col gap-3 overflow-y-auto p-3">
      <Input v-model="query" type="search" :placeholder="searchPlaceholder" class="text-xs" />
      <nav class="flex flex-col gap-0.5">
        <button
          v-for="section in filtered"
          :key="section.id"
          type="button"
          class="rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          @click="goTo(section.id)"
        >
          {{ section.title }}
        </button>
        <p v-if="filtered.length === 0" class="px-2 py-1.5 text-xs text-muted-foreground">
          {{ noResultsLabel }}
        </p>
      </nav>
    </div>
  </aside>

  <button
    type="button"
    class="fixed bottom-4 left-4 z-dropdown inline-flex size-8 items-center justify-center rounded-full border border-border bg-card shadow-md"
    @click="collapsed = !collapsed"
  >
    <PanelLeftOpen v-if="collapsed" class="size-4" />
    <PanelLeftClose v-else class="size-4" />
  </button>
</template>
