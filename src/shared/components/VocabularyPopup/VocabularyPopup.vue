<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'

const props = defineProps<{
  word: string
  exampleSentence: string
  top: number
  left: number
}>()

const emit = defineEmits<{
  save: [meaning: string]
  cancel: []
}>()

const meaning = ref('')

function handleSave() {
  emit('save', meaning.value)
}
</script>

<template>
  <div
    class="absolute z-popover w-72 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
    :style="{ top: `${top}px`, left: `${left}px` }"
    @mousedown.stop
    @mouseup.stop
  >
    <p class="text-sm font-semibold">{{ props.word }}</p>
    <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ props.exampleSentence }}</p>
    <Textarea
      v-model="meaning"
      placeholder="Meaning..."
      class="mt-2 min-h-16 text-sm"
      autofocus
    />
    <div class="mt-2 flex justify-end gap-2">
      <Button variant="ghost" size="sm" @click="$emit('cancel')">Cancel</Button>
      <Button size="sm" @click="handleSave">Save</Button>
    </div>
  </div>
</template>
