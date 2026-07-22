<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'

const text = ref('')
const password = ref('')
const search = ref('')
const textarea = ref('')
</script>

<template>
  <div class="grid max-w-md gap-4">
    <div class="space-y-1.5">
      <Label>Text</Label>
      <Input v-model="text" placeholder="Lesson title" />
    </div>
    <div class="space-y-1.5">
      <Label>Password</Label>
      <Input v-model="password" type="password" placeholder="••••••••" />
    </div>
    <div class="space-y-1.5">
      <Label>Search</Label>
      <Input v-model="search" type="search" placeholder="Search vocabulary..." />
    </div>
    <div class="space-y-1.5">
      <Label>Textarea</Label>
      <Textarea v-model="textarea" placeholder="Meaning..." />
    </div>
  </div>
</template>
