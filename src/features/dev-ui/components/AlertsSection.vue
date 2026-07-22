<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
</script>

<template>
  <div class="grid max-w-lg gap-3">
    <Alert variant="info">
      <Info />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>This lesson is still being processed.</AlertDescription>
    </Alert>
    <Alert variant="success">
      <CheckCircle2 />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Vocabulary saved to your list.</AlertDescription>
    </Alert>
    <Alert variant="warning">
      <TriangleAlert />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Audio is longer than one hour and may take a while.</AlertDescription>
    </Alert>
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again.</AlertDescription>
    </Alert>
  </div>
</template>
