<script setup lang="ts">
import { BookOpen, SearchX } from '@lucide/vue'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import EmptyState from '@/shared/components/EmptyState/EmptyState.vue'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import VocabularyCard from '@/shared/components/VocabularyCard/VocabularyCard.vue'
import { useVocabularyStore } from '../stores/vocabulary.store'

const { t } = useI18n({ useScope: 'global' })
const vocabularyStore = useVocabularyStore()

onMounted(() => {
  vocabularyStore.fetchVocabulary()
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
    <h1 class="text-lg font-semibold text-foreground">{{ t('vocabulary.page.title') }}</h1>

    <Input
      v-model="vocabularyStore.searchQuery"
      type="search"
      :placeholder="t('vocabulary.page.searchPlaceholder')"
      class="max-w-xs"
    />

    <div v-if="vocabularyStore.loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 3" :key="i" class="h-28 w-full" />
    </div>

    <EmptyState
      v-else-if="vocabularyStore.items.length === 0"
      :icon="BookOpen"
      :title="t('vocabulary.page.emptyTitle')"
      :description="t('vocabulary.page.emptyDescription')"
    />

    <EmptyState
      v-else-if="vocabularyStore.filteredItems.length === 0"
      :icon="SearchX"
      :title="t('vocabulary.page.noResultsTitle')"
    />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <VocabularyCard
        v-for="item in vocabularyStore.filteredItems"
        :key="item.id"
        :word="item.word"
        :meaning="item.meaning"
        :example-sentence="item.exampleSentence"
      />
    </div>
  </div>
</template>
