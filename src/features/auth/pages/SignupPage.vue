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
const needsEmailConfirmation = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  try {
    const result = await authStore.signUp(email.value, password.value)
    if (result.needsEmailConfirmation) {
      needsEmailConfirmation.value = true
    } else {
      router.push('/library')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{{ t('auth.signup.title') }}</CardTitle>
        <CardDescription>{{ t('auth.signup.subtitle') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert v-if="needsEmailConfirmation" variant="info">
          <AlertDescription>{{ t('auth.signup.checkEmail') }}</AlertDescription>
        </Alert>

        <form v-else class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="signup-email">{{ t('auth.signup.emailLabel') }}</Label>
            <Input id="signup-email" v-model="email" type="email" required autocomplete="email" />
          </div>
          <div class="space-y-1.5">
            <Label for="signup-password">{{ t('auth.signup.passwordLabel') }}</Label>
            <Input
              id="signup-password"
              v-model="password"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </div>

          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <Button type="submit" class="w-full" :loading="authStore.loading">
            {{ t('auth.signup.submit') }}
          </Button>
        </form>

        <p v-if="!needsEmailConfirmation" class="mt-4 text-center text-sm text-muted-foreground">
          {{ t('auth.signup.hasAccount') }}
          <RouterLink to="/login" class="font-medium text-primary hover:underline">
            {{ t('auth.signup.loginLink') }}
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
