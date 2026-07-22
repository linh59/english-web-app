<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
</script>

<template>
  <div class="max-w-sm">
    <Card>
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>A short supporting description.</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">Card content goes here.</p>
      </CardContent>
    </Card>
  </div>
</template>
