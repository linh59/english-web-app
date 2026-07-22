<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Navbar from '@/shared/components/Navbar/Navbar.vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const authStore = useAuthStore()

const links = computed(() => [
  { label: t('lessons.nav.library'), to: '/library' },
  { label: t('vocabulary.nav.title'), to: '/vocabulary' },
])

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <Navbar app-name="English App" :links="links" @logout="handleLogout" />
    <main>
      <RouterView />
      
    </main>
  </div>
</template>
