<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import Progress from '@/shared/components/Progress/Progress.vue'
import { MAX_RAW_UPLOAD_SIZE_BYTES, useLessonsStore } from '../stores/lessons.store'

const { t } = useI18n({ useScope: 'global' })
const lessonsStore = useLessonsStore()

const open = ref(false)
const file = ref<File | null>(null)
const title = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const compressionPhase = ref<'loading' | 'compressing' | null>(null)
const compressionProgress = ref(0)

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0] ?? null
  errorMessage.value = ''
  if (selected && selected.size > MAX_RAW_UPLOAD_SIZE_BYTES) {
    file.value = null
    input.value = ''
    errorMessage.value = t('lessons.upload.fileTooLarge')
    return
  }

  file.value = selected
  if (selected && !title.value) {
    title.value = selected.name.replace(/\.[^/.]+$/, '')
  }
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message === 'FILE_TOO_LARGE') return t('lessons.upload.fileTooLarge')
  if (message === 'FILE_TOO_LARGE_AFTER_COMPRESSION') return t('lessons.upload.fileTooLargeAfterCompression')
  if (message.startsWith('COMPRESSION_LOAD_FAILED') || message.startsWith('COMPRESSION_FAILED')) {
    return t('lessons.upload.compressionFailed')
  }
  return message
}

async function handleSubmit() {
  if (!file.value || !title.value) return

  submitting.value = true
  errorMessage.value = ''
  compressionPhase.value = null
  compressionProgress.value = 0
  try {
    await lessonsStore.uploadLesson(file.value, title.value, (phase, progress) => {
      compressionPhase.value = phase
      compressionProgress.value = progress * 100
    })
    open.value = false
    file.value = null
    title.value = ''
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    submitting.value = false
    compressionPhase.value = null
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>{{ t('lessons.upload.trigger') }}</Button>
    </DialogTrigger>
    <DialogContent
      :show-close-button="!submitting"
      @escape-key-down="(event) => submitting && event.preventDefault()"
      @pointer-down-outside="(event) => submitting && event.preventDefault()"
    >
      <DialogHeader>
        <DialogTitle>{{ t('lessons.upload.title') }}</DialogTitle>
        <DialogDescription>{{ t('lessons.upload.description') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label for="lesson-audio">{{ t('lessons.upload.fileLabel') }}</Label>
          <input
            id="lesson-audio"
            type="file"
            accept="audio/*"
            :disabled="submitting"
            class="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
            @change="handleFileChange"
          >
        </div>
        <div class="space-y-1.5">
          <Label for="lesson-title">{{ t('lessons.upload.titleLabel') }}</Label>
          <Input id="lesson-title" v-model="title" :disabled="submitting" />
        </div>

        <Progress
          v-if="compressionPhase"
          :value="compressionProgress"
          :label="t(compressionPhase === 'loading' ? 'lessons.upload.preparingCompression' : 'lessons.upload.compressing')"
        />

        <Alert v-if="errorMessage" variant="destructive">
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button variant="ghost" :disabled="submitting" @click="open = false">{{ t('common.cancel') }}</Button>
        <Button :disabled="!file || !title" :loading="submitting" @click="handleSubmit">
          {{ t('lessons.upload.submit') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
