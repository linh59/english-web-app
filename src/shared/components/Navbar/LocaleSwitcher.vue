<script setup lang="ts">
import { Languages } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useLocale } from '@/shared/lib/i18n'

const { t } = useI18n({ useScope: 'global' })
const { locale, setLocale, availableLocales } = useLocale()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label="Change language"
      class="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors hover:bg-muted"
    >
      <Languages class="size-3.5" />
      {{ locale.toUpperCase() }}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="option in availableLocales"
        :key="option"
        :class="option === locale && 'font-semibold text-primary'"
        @click="setLocale(option)"
      >
        {{ t(`common.language.${option}`) }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
