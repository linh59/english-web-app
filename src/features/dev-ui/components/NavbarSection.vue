<script setup lang="ts">
import Navbar from '@/shared/components/Navbar/Navbar.vue'

const links = [
  { label: 'Library', to: '/library' },
  { label: 'Vocabulary', to: '/vocabulary' },
]
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-border">
    <Navbar app-name="English App" :links="links" />
  </div>
</template>
