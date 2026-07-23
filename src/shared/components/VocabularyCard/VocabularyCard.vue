<script setup lang="ts">
import type { VocabularyCefrLevel, VocabularyWordType } from '@/features/vocabulary/types'
import { BookmarkCheck, Headphones, Pencil, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CEFR_CLASS, WORD_TYPE_CLASS } from '@/features/vocabulary/lib/wordTypeStyle'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

const props = defineProps<{
  word: string
  meaning: string
  definitionEn: string
  exampleSentence: string
  encounterCount: number
  wordType: VocabularyWordType | null
  cefrLevel: VocabularyCefrLevel | null
  canListen: boolean
}>()

defineEmits<{
  edit: []
  delete: []
  listen: []
}>()

const { t } = useI18n({ useScope: 'global' })

// Front face only shows the word + category badges so a list of many cards
// scans quickly; click/tap flips to the definition/meaning/example — fixes
// the original complaint that word/meaning/example at the same size made it
// hard to spot the word actually being learned.
const isFlipped = ref(false)
function toggleFlip() {
  isFlipped.value = !isFlipped.value
}

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
        <CardTitle class="truncate text-lg font-semibold">
          {{ word }}
        </CardTitle>
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
    <CardContent>
      <div
        role="button"
        tabindex="0"
        class="cursor-pointer rounded-md [perspective:1000px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        :aria-expanded="isFlipped"
        :aria-label="isFlipped ? t('vocabulary.card.hideMeaning') : t('vocabulary.card.showMeaning')"
        @click="toggleFlip"
        @keydown.enter.prevent="toggleFlip"
        @keydown.space.prevent="toggleFlip"
      >
        <div
          class="grid transition-transform duration-300 ease-smooth [transform-style:preserve-3d]"
          :class="isFlipped ? '[transform:rotateY(180deg)]' : ''"
        >
          <!-- Front: category badges only -->
          <div class="col-start-1 row-start-1 flex min-h-8 flex-wrap items-center gap-1 [backface-visibility:hidden]">
            <Badge v-if="wordTypeLabel" :class="WORD_TYPE_CLASS[wordType!]">
              {{ wordTypeLabel }}
            </Badge>
            <Badge v-if="cefrLevel" :class="CEFR_CLASS[cefrLevel]">
              {{ cefrLevel }}
            </Badge>
            <Badge v-if="encounterCount > 1" variant="info">
              <BookmarkCheck />
              {{ t('vocabulary.card.encounterCount', { count: encounterCount }) }}
            </Badge>
            <span v-if="!wordTypeLabel && !cefrLevel && encounterCount <= 1" class="text-xs text-muted-foreground">
              {{ t('vocabulary.card.showMeaning') }}
            </span>
          </div>

          <!-- Back: definition / meaning / example -->
          <div class="col-start-1 row-start-1 space-y-1.5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p v-if="definitionEn" class="text-sm font-medium text-foreground">
              {{ definitionEn }}
            </p>
            <p v-if="meaning" class="text-xs text-muted-foreground">
              {{ meaning }}
            </p>
            <p class="border-l-2 border-border pl-2 text-xs text-muted-foreground italic">
              "{{ exampleSentence }}"
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
