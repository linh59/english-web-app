<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { PasswordInput } from '@/shared/components/ui/input'
import { useAuthStore } from '../stores/auth.store'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const done = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = t('auth.resetPassword.mismatch')
    return
  }

  try {
    await authStore.updatePassword(password.value)
    done.value = true
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{{ t('auth.resetPassword.title') }}</CardTitle>
        <CardDescription>{{ t('auth.resetPassword.subtitle') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form v-if="!done" class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="reset-password-new">{{ t('auth.resetPassword.newPasswordLabel') }}</Label>
            <PasswordInput
              id="reset-password-new"
              v-model="password"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="reset-password-confirm">{{ t('auth.resetPassword.confirmPasswordLabel') }}</Label>
            <PasswordInput
              id="reset-password-confirm"
              v-model="confirmPassword"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </div>

          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <Button type="submit" class="w-full" :loading="authStore.loading">
            {{ t('auth.resetPassword.submit') }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
