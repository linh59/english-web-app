import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { VocabularyRow } from '@/shared/lib/database.types'
import { supabase } from '@/shared/lib/supabase'
import type { VocabularyItem } from '../types'

function mapVocabulary(row: VocabularyRow): VocabularyItem {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning ?? '',
    exampleSentence: row.example_sentence ?? '',
    createdAt: row.created_at,
  }
}

export const useVocabularyStore = defineStore('vocabulary', () => {
  const items = ref<VocabularyItem[]>([])
  const loading = ref(false)
  const searchQuery = ref('')

  const filteredItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return items.value
    return items.value.filter(
      (item) =>
        item.word.toLowerCase().includes(query) || item.meaning.toLowerCase().includes(query),
    )
  })

  async function fetchVocabulary() {
    const authStore = useAuthStore()

    loading.value = true
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', authStore.user!.id)
      .order('created_at', { ascending: false })
    loading.value = false
    if (error) throw error

    items.value = (data as VocabularyRow[]).map(mapVocabulary)
  }

  async function saveVocabulary(input: {
    word: string
    meaning: string
    exampleSentence: string
    lessonId?: string
  }) {
    const authStore = useAuthStore()
    const { data, error } = await supabase
      .from('vocabulary')
      .insert({
        user_id: authStore.user!.id,
        lesson_id: input.lessonId ?? null,
        word: input.word,
        meaning: input.meaning,
        example_sentence: input.exampleSentence,
      })
      .select()
      .single()
    if (error) throw error

    items.value.unshift(mapVocabulary(data as VocabularyRow))
  }

  return { items, filteredItems, loading, searchQuery, fetchVocabulary, saveVocabulary }
})
