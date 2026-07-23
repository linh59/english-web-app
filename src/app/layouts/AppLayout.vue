<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BottomNav from '@/shared/components/Navbar/BottomNav.vue'
import Navbar from '@/shared/components/Navbar/Navbar.vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const links = computed(() => [
  { label: t('lessons.nav.library'), to: '/library' },
  { label: t('vocabulary.nav.title'), to: '/vocabulary' },
])

// The study page (lesson-study) has its own fixed bottom player bar with a
// back button standing in for navigation — showing this tab bar on top of it
// would leave too little vertical space for the transcript on mobile.
const showBottomNav = computed(() => route.name !== 'lesson-study')

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <Navbar app-name="English App" :links="links" @logout="handleLogout" />
    <main :class="showBottomNav && 'pb-16 sm:pb-0'">
      <RouterView />
    </main>
    <BottomNav v-if="showBottomNav" :links="links" />
  </div>
</template>
