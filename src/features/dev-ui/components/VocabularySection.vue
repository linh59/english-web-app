<script setup lang="ts">
import VocabularyCard from '@/shared/components/VocabularyCard/VocabularyCard.vue'

const ITEMS = [
  { word: 'nevertheless', meaning: 'in spite of that; even so', exampleSentence: 'It was raining, nevertheless we went for a walk.' },
  { word: 'get going', meaning: 'to start moving or leave', exampleSentence: 'We should get going before it rains.' },
]
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <VocabularyCard
      v-for="item in ITEMS"
      :key="item.word"
      :word="item.word"
      :meaning="item.meaning"
      :example-sentence="item.exampleSentence"
    />
  </div>
</template>
