<script setup lang="ts">
import VocabularyCard from '@/shared/components/VocabularyCard/VocabularyCard.vue'

const ITEMS = [
  {
    word: 'nevertheless',
    meaning: 'dù vậy, tuy nhiên',
    definitionEn: 'in spite of that; even so',
    exampleSentence: 'It was raining, nevertheless we went for a walk.',
    encounterCount: 1,
    wordType: 'single_word',
    cefrLevel: 'B2',
  },
  {
    word: 'get going',
    meaning: 'bắt đầu di chuyển hoặc rời đi',
    definitionEn: 'to start moving or leave',
    exampleSentence: 'We should get going before it rains.',
    encounterCount: 3,
    wordType: 'phrasal_verb',
    cefrLevel: 'B1',
  },
]
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <VocabularyCard
      v-for="item in ITEMS"
      :key="item.word"
      :word="item.word"
      :meaning="item.meaning"
      :definition-en="item.definitionEn"
      :example-sentence="item.exampleSentence"
      :encounter-count="item.encounterCount"
      :word-type="item.wordType"
      :cefr-level="item.cefrLevel"
      :can-listen="false"
    />
  </div>
</template>
