<script setup lang="ts">
import { CheckCircle2, X, XCircle } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/shared/composables/useToast'
import { Alert, AlertAction, AlertDescription } from '@/shared/components/ui/alert'

const { toasts, dismiss } = useToast()
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-4 z-toast flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <TransitionGroup
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0"
      >
        <Alert
          v-for="item in toasts"
          :key="item.id"
          :variant="item.variant"
          class="pointer-events-auto w-full max-w-sm shadow-lg"
        >
          <CheckCircle2 v-if="item.variant === 'success'" />
          <XCircle v-else />
          <AlertDescription>{{ item.message }}</AlertDescription>
          <AlertAction>
            <button
              type="button"
              class="text-current opacity-60 hover:opacity-100"
              :aria-label="t('common.close')"
              @click="dismiss(item.id)"
            >
              <X class="size-3.5" />
            </button>
          </AlertAction>
        </Alert>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
