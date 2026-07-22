<script setup lang="ts">
import { Loader2, RotateCw, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import Progress from '@/shared/components/Progress/Progress.vue'
import { formatDuration } from '@/shared/lib/format'

export type LessonStatus = 'pending' | 'processing' | 'done' | 'failed'

const props = defineProps<{
  title: string
  durationSeconds: number
  status: LessonStatus
  processingStep?: string | null
}>()

defineEmits<{
  open: []
  delete: []
  retry: []
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
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="truncate text-sm">{{ title }}</CardTitle>
        <div class="flex shrink-0 items-center">
          <Button
            v-if="status === 'failed'"
            variant="ghost"
            size="icon-sm"
            aria-label="Retry"
            class="text-muted-foreground hover:text-foreground"
            @click.stop="$emit('retry')"
          >
            <RotateCw />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-muted-foreground hover:text-destructive"
            @click.stop="$emit('delete')"
          >
            <Trash2 />
          </Button>
        </div>
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
