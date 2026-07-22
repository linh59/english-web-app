<script setup lang="ts">
import { ref } from 'vue'
import Transcript from '@/shared/components/Transcript/Transcript.vue'
import type { VocabularySaveInput } from '@/shared/components/Transcript/types'

const sentences = [
  { id: '1', text: 'Nice to meet you, I have heard so much about you.', startTime: 0, endTime: 3 },
  { id: '2', text: 'The pleasure is all mine, thank you for having me.', startTime: 3, endTime: 6 },
  { id: '3', text: 'Nevertheless, we should get going before it rains.', startTime: 6, endTime: 9 },
]

const activeSentenceId = ref('2')
const lastSaved = ref<VocabularySaveInput | null>(null)

function handleSave(payload: VocabularySaveInput) {
  lastSaved.value = payload
}
</script>

<template>
  <div class="max-w-xl space-y-3">
    <p class="text-xs text-muted-foreground">
      Try it: select a word or phrase below to open the Vocabulary Popup.
    </p>
    <Transcript
      :sentences="sentences"
      :active-sentence-id="activeSentenceId"
      @sentence-click="activeSentenceId = $event"
      @save-vocabulary="handleSave"
    />
    <p v-if="lastSaved" class="text-xs text-success">
      Saved "{{ lastSaved.word }}" — {{ lastSaved.meaning || '(no meaning entered)' }}
    </p>
  </div>
</template>
