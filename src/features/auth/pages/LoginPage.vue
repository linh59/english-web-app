<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useAuthStore } from '../stores/auth.store'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  try {
    await authStore.signIn(email.value, password.value)
    router.push('/library')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{{ t('auth.login.title') }}</CardTitle>
        <CardDescription>{{ t('auth.login.subtitle') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="login-email">{{ t('auth.login.emailLabel') }}</Label>
            <Input id="login-email" v-model="email" type="email" required autocomplete="email" />
          </div>
          <div class="space-y-1.5">
            <Label for="login-password">{{ t('auth.login.passwordLabel') }}</Label>
            <Input
              id="login-password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
            />
          </div>

          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <Button type="submit" class="w-full" :loading="authStore.loading">
            {{ t('auth.login.submit') }}
          </Button>
        </form>

        <p class="mt-4 text-center text-sm text-muted-foreground">
          {{ t('auth.login.noAccount') }}
          <RouterLink to="/signup" class="font-medium text-primary hover:underline">
            {{ t('auth.login.signupLink') }}
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
