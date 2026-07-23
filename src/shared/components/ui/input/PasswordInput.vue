<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { Eye, EyeOff } from '@lucide/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/shared/lib/utils'
import { Input } from '.'

const props = defineProps<{
  defaultValue?: string
  modelValue?: string
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void
}>()

defineOptions({ inheritAttrs: false })

const { t } = useI18n({ useScope: 'global' })

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const visible = ref(false)
</script>

<template>
  <div class="relative">
    <Input
      v-model="modelValue"
      v-bind="$attrs"
      :type="visible ? 'text' : 'password'"
      :class="cn('pr-7', props.class)"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-7 items-center justify-center text-muted-foreground outline-none hover:text-foreground"
      :aria-label="visible ? t('common.password.hide') : t('common.password.show')"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" class="size-3.5" />
      <Eye v-else class="size-3.5" />
    </button>
  </div>
</template>
