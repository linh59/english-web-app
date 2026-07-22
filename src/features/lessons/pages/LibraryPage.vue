<script setup lang="ts">
import { Sparkles } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import EmptyState from '@/shared/components/EmptyState/EmptyState.vue'
import LessonCard from '@/shared/components/LessonCard/LessonCard.vue'
import { Button } from '@/shared/components/ui/button'
import UploadLessonDialog from '../components/UploadLessonDialog.vue'
import { useLessonsStore } from '../stores/lessons.store'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const lessonsStore = useLessonsStore()

const pendingDeleteId = ref<string | null>(null)

onMounted(() => {
  lessonsStore.fetchLessons()
})

function openLesson(id: string) {
  router.push(`/lessons/${id}`)
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  await lessonsStore.deleteLesson(pendingDeleteId.value)
  pendingDeleteId.value = null
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold text-foreground">{{ t('lessons.library.title') }}</h1>
      <UploadLessonDialog />
    </div>

    <div v-if="lessonsStore.loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 3" :key="i" class="h-32 w-full" />
    </div>

    <EmptyState
      v-else-if="lessonsStore.lessons.length === 0"
      :icon="Sparkles"
      :title="t('lessons.library.emptyTitle')"
      :description="t('lessons.library.emptyDescription')"
    />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <LessonCard
        v-for="lesson in lessonsStore.lessons"
        :key="lesson.id"
        :title="lesson.title"
        :duration-seconds="lesson.durationSeconds ?? 0"
        :status="lesson.status"
        @open="openLesson(lesson.id)"
        @delete="pendingDeleteId = lesson.id"
        @retry="lessonsStore.retryLesson(lesson.id)"
      />
    </div>

    <Dialog :open="!!pendingDeleteId" @update:open="(value) => !value && (pendingDeleteId = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('lessons.library.deleteTitle') }}</DialogTitle>
          <DialogDescription>{{ t('lessons.library.deleteDescription') }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" @click="pendingDeleteId = null">{{ t('common.cancel') }}</Button>
          <Button variant="destructive" @click="confirmDelete">{{ t('common.delete') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
