<script setup lang="ts">
import { BookOpen, SearchX } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import EmptyState from '@/shared/components/EmptyState/EmptyState.vue'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import VocabularyCard from '@/shared/components/VocabularyCard/VocabularyCard.vue'
import VocabularyFields from '@/shared/components/VocabularyPopup/VocabularyFields.vue'
import { useVocabularyStore } from '../stores/vocabulary.store'
import type { VocabularyItem } from '../types'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const vocabularyStore = useVocabularyStore()

const editingItem = ref<VocabularyItem | null>(null)
const editMeaning = ref('')
const editDefinitionEn = ref('')
const pendingDeleteId = ref<string | null>(null)

onMounted(() => {
  vocabularyStore.fetchVocabulary()
})

function openEdit(item: VocabularyItem) {
  editingItem.value = item
  editMeaning.value = item.meaning
  editDefinitionEn.value = item.definitionEn
}

async function confirmEdit() {
  if (!editingItem.value) return
  await vocabularyStore.updateVocabulary(editingItem.value.id, {
    meaning: editMeaning.value,
    definitionEn: editDefinitionEn.value,
  })
  editingItem.value = null
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  await vocabularyStore.deleteVocabulary(pendingDeleteId.value)
  pendingDeleteId.value = null
}

// lessonId/startTime are only missing for vocabulary saved before this
// feature existed — VocabularyCard hides the button in that case (canListen).
function listenAgain(item: VocabularyItem) {
  if (!item.lessonId || item.startTime == null) return
  router.push({ name: 'lesson-study', params: { id: item.lessonId }, query: { t: String(item.startTime) } })
}
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
        :definition-en="item.definitionEn"
        :example-sentence="item.exampleSentence"
        :encounter-count="item.encounterCount"
        :word-type="item.wordType"
        :cefr-level="item.cefrLevel"
        :can-listen="!!item.lessonId && item.startTime != null"
        @edit="openEdit(item)"
        @delete="pendingDeleteId = item.id"
        @listen="listenAgain(item)"
      />
    </div>

    <Dialog :open="!!editingItem" @update:open="(value) => !value && (editingItem = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('vocabulary.card.editTitle') }}</DialogTitle>
        </DialogHeader>
        <VocabularyFields
          v-if="editingItem"
          :word="editingItem.word"
          :example-sentence="editingItem.exampleSentence"
          :meaning="editMeaning"
          :definition-en="editDefinitionEn"
          :part-of-speech="editingItem.partOfSpeech"
          :word-type="editingItem.wordType"
          :cefr-level="editingItem.cefrLevel"
          :synonyms="editingItem.synonyms"
          :antonyms="editingItem.antonyms"
          @update:meaning="editMeaning = $event"
          @update:definition-en="editDefinitionEn = $event"
        />
        <DialogFooter>
          <Button variant="ghost" @click="editingItem = null">{{ t('common.cancel') }}</Button>
          <Button @click="confirmEdit">{{ t('common.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="!!pendingDeleteId" @update:open="(value) => !value && (pendingDeleteId = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('vocabulary.card.deleteTitle') }}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" @click="pendingDeleteId = null">{{ t('common.cancel') }}</Button>
          <Button variant="destructive" @click="confirmDelete">{{ t('common.delete') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
