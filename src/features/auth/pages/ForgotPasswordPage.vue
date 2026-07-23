<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useAuthStore } from '../stores/auth.store'

const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()

const email = ref('')
const errorMessage = ref('')
const sent = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  try {
    await authStore.sendPasswordResetEmail(email.value)
    sent.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{{ t('auth.forgotPassword.title') }}</CardTitle>
        <CardDescription>{{ t('auth.forgotPassword.subtitle') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert v-if="sent" variant="info">
          <AlertDescription>{{ t('auth.forgotPassword.checkEmail') }}</AlertDescription>
        </Alert>

        <form v-else class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="forgot-password-email">{{ t('auth.forgotPassword.emailLabel') }}</Label>
            <Input id="forgot-password-email" v-model="email" type="email" required autocomplete="email" />
          </div>

          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <Button type="submit" class="w-full" :loading="authStore.loading">
            {{ t('auth.forgotPassword.submit') }}
          </Button>
        </form>

        <p class="mt-4 text-center text-sm text-muted-foreground">
          <RouterLink to="/login" class="font-medium text-primary hover:underline">
            {{ t('auth.forgotPassword.backToLogin') }}
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
