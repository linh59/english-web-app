<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

defineProps<{
  word: string
  meaning: string
  exampleSentence: string
}>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-sm">{{ word }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-1.5">
      <p class="text-sm text-foreground">{{ meaning }}</p>
      <p class="text-xs italic text-muted-foreground">"{{ exampleSentence }}"</p>
    </CardContent>
  </Card>
</template>
