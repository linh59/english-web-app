<script setup lang="ts">
import { BookmarkCheck, Headphones, Pencil, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

const props = defineProps<{
  word: string
  meaning: string
  definitionEn: string
  exampleSentence: string
  encounterCount: number
  wordType: string | null
  cefrLevel: string | null
  canListen: boolean
}>()

defineEmits<{
  edit: []
  delete: []
  listen: []
}>()

const { t } = useI18n({ useScope: 'global' })

const wordTypeLabel = computed(() => {
  switch (props.wordType) {
    case 'single_word':
      return t('vocabulary.wordType.singleWord')
    case 'phrasal_verb':
      return t('vocabulary.wordType.phrasalVerb')
    case 'idiom':
      return t('vocabulary.wordType.idiom')
    case 'collocation':
      return t('vocabulary.wordType.collocation')
    case 'phrase':
      return t('vocabulary.wordType.phrase')
    default:
      return null
  }
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="truncate text-sm">{{ word }}</CardTitle>
        <div class="flex shrink-0 items-center">
          <Button
            v-if="canListen"
            variant="ghost"
            size="icon-sm"
            class="text-muted-foreground hover:text-foreground"
            :aria-label="t('vocabulary.card.listenAgain')"
            @click="$emit('listen')"
          >
            <Headphones />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-muted-foreground hover:text-foreground"
            :aria-label="t('common.edit')"
            @click="$emit('edit')"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-muted-foreground hover:text-destructive"
            :aria-label="t('common.delete')"
            @click="$emit('delete')"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="space-y-1.5">
      <div v-if="wordTypeLabel || cefrLevel || encounterCount > 1" class="flex flex-wrap gap-1">
        <Badge v-if="wordTypeLabel" variant="secondary">{{ wordTypeLabel }}</Badge>
        <Badge v-if="cefrLevel" variant="outline">{{ cefrLevel }}</Badge>
        <Badge v-if="encounterCount > 1" variant="info">
          <BookmarkCheck />
          {{ t('vocabulary.card.encounterCount', { count: encounterCount }) }}
        </Badge>
      </div>
      <p v-if="definitionEn" class="text-sm text-foreground">{{ definitionEn }}</p>
      <p v-if="meaning" class="text-sm text-muted-foreground">{{ meaning }}</p>
      <p class="text-xs italic text-muted-foreground">"{{ exampleSentence }}"</p>
    </CardContent>
  </Card>
</template>
