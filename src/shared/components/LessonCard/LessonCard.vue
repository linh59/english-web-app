<script setup lang="ts">
import { Loader2, RotateCw, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatDuration } from '@/shared/lib/format'

export type LessonStatus = 'pending' | 'processing' | 'done' | 'failed'

const props = defineProps<{
  title: string
  durationSeconds: number
  status: LessonStatus
}>()

defineEmits<{
  open: []
  delete: []
  retry: []
}>()

const statusVariant = computed<'success' | 'info' | 'warning' | 'destructive'>(() => {
  if (props.status === 'done') return 'success'
  if (props.status === 'processing') return 'info'
  if (props.status === 'failed') return 'destructive'
  return 'warning'
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
    <CardContent class="flex items-center justify-between">
      <span class="text-xs text-muted-foreground">{{ formatDuration(durationSeconds) }}</span>
      <Badge :variant="statusVariant">
        <Loader2 v-if="status === 'processing'" class="size-3 animate-spin" />
        {{ status }}
      </Badge>
    </CardContent>
  </Card>
</template>
