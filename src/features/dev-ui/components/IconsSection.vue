<script setup lang="ts">
import {
  AlertCircle,
  BookmarkPlus,
  BookOpen,
  CheckCircle2,
  Info,
  Languages,
  Loader2,
  LogOut,
  Moon,
  Pause,
  Play,
  Plus,
  Repeat,
  SearchX,
  Sparkles,
  Sun,
  TriangleAlert,
  Trash2,
  User,
  Volume2,
} from '@lucide/vue'
import { computed, ref } from 'vue'
import { Input } from '@/shared/components/ui/input'

const ICONS = [
  { name: 'Play', component: Play },
  { name: 'Pause', component: Pause },
  { name: 'Repeat', component: Repeat },
  { name: 'Loader2', component: Loader2 },
  { name: 'Trash2', component: Trash2 },
  { name: 'Sun', component: Sun },
  { name: 'Moon', component: Moon },
  { name: 'Languages', component: Languages },
  { name: 'User', component: User },
  { name: 'LogOut', component: LogOut },
  { name: 'BookmarkPlus', component: BookmarkPlus },
  { name: 'Plus', component: Plus },
  { name: 'AlertCircle', component: AlertCircle },
  { name: 'CheckCircle2', component: CheckCircle2 },
  { name: 'Info', component: Info },
  { name: 'TriangleAlert', component: TriangleAlert },
  { name: 'Volume2', component: Volume2 },
  { name: 'BookOpen', component: BookOpen },
  { name: 'SearchX', component: SearchX },
  { name: 'Sparkles', component: Sparkles },
]

const query = ref('')
const filtered = computed(() =>
  ICONS.filter((icon) => icon.name.toLowerCase().includes(query.value.toLowerCase())),
)
</script>

<template>
  <div class="space-y-4">
    <Input v-model="query" type="search" placeholder="Search icons..." class="max-w-xs" />
    <div class="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
      <div
        v-for="icon in filtered"
        :key="icon.name"
        class="flex flex-col items-center gap-1.5 rounded-md border border-border p-3"
      >
        <component :is="icon.component" class="size-5 text-foreground" />
        <span class="truncate text-xs text-muted-foreground">{{ icon.name }}</span>
      </div>
    </div>
  </div>
</template>
