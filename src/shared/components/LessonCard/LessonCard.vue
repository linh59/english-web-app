<script setup lang="ts">
import { Clock, Languages, Loader2, MoreVertical, RotateCw, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import Progress from '@/shared/components/Progress/Progress.vue'
import { formatDuration } from '@/shared/lib/format'

export type LessonStatus = 'pending' | 'processing' | 'done' | 'failed'
export type TranslationStatus = 'pending' | 'processing' | 'done' | 'failed'

const props = defineProps<{
  title: string
  durationSeconds: number
  status: LessonStatus
  processingStep?: string | null
  translationStatus?: TranslationStatus
  // Computed from actual sentence/translation counts (see
  // lessons.store.ts::fetchTranslationProgress), not from translationStatus —
  // translationStatus can get stuck at 'processing' if the tab closes mid-run,
  // the same failure mode already seen with `status` for transcription.
  needsTranslation?: boolean
}>()

defineEmits<{
  open: []
  delete: []
  retry: []
  translate: []
  retimestamp: []
}>()

const { t } = useI18n({ useScope: 'global' })

const statusVariant = computed<'success' | 'info' | 'warning' | 'destructive'>(() => {
  if (props.status === 'done') return 'success'
  if (props.status === 'processing') return 'info'
  if (props.status === 'failed') return 'destructive'
  return 'warning'
})

const chunkProgress = computed(() => {
  const match = props.processingStep?.match(/^chunk (\d+)\/(\d+)$/)
  if (!match) return null

  const current = Number(match[1])
  const total = Number(match[2])
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return null

  return { current, total, percent: (current / total) * 100 }
})
</script>

<template>
  <Card class="cursor-pointer transition-shadow hover:shadow-md" @click="$emit('open')">
    <CardHeader>
      <div class="flex min-w-0 items-start justify-between gap-2">
        <CardTitle class="min-w-0 flex-1 truncate text-sm">{{ title }}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger
            :aria-label="t('lessons.library.actions')"
            class="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click.stop
          >
            <Loader2 v-if="translationStatus === 'processing'" class="size-4 animate-spin" />
            <MoreVertical v-else class="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" @click.stop>
            <DropdownMenuItem v-if="status === 'failed'" @click="$emit('retry')">
              <RotateCw class="size-3.5" />
              {{ t('lessons.library.retry') }}
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="status === 'done' && (needsTranslation || translationStatus === 'processing')"
              @click="$emit('translate')"
            >
              <Languages class="size-3.5" />
              {{ translationStatus === 'processing' ? t('lessons.library.translating') : t('lessons.library.translate') }}
            </DropdownMenuItem>
            <DropdownMenuItem v-if="status === 'done'" @click="$emit('retimestamp')">
              <Clock class="size-3.5" />
              {{ t('lessons.library.retimestamp') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" @click="$emit('delete')">
              <Trash2 class="size-3.5" />
              {{ t('common.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted-foreground">{{ formatDuration(durationSeconds) }}</span>
        <Badge :variant="statusVariant">
          <Loader2 v-if="status === 'processing'" class="size-3 animate-spin" />
          {{ status }}
        </Badge>
      </div>
      <Progress
        v-if="chunkProgress"
        :value="chunkProgress.percent"
        :label="t('lessons.library.processingChunk', { current: chunkProgress.current, total: chunkProgress.total })"
      />
    </CardContent>
  </Card>
</template>
