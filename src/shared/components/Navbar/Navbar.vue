<script setup lang="ts">
import { LogOut, Menu, User } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import LocaleSwitcher from './LocaleSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{
  appName: string
  links: { label: string, to: string }[]
}>()

defineEmits<{
  logout: []
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
    <div class="flex items-center gap-6">
      <span class="text-sm font-semibold text-foreground">{{ appName }}</span>
      <nav class="hidden gap-4 sm:flex">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-sm text-muted-foreground transition-colors hover:text-foreground"
          active-class="text-foreground font-medium"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <!-- <nav> above is hidden below sm (640px) with no fallback, so mobile
      needs its own way to reach Library/Vocabulary — reuses the same
      DropdownMenu primitive as the user menu on the right, not a new
      Bottom Navigation/Sidebar component (both cut from V1). -->
      <DropdownMenu>
        <DropdownMenuTrigger
          class="inline-flex size-8 items-center justify-center rounded-full bg-muted hover:bg-muted/70 sm:hidden"
          :aria-label="t('common.nav.menu')"
        >
          <Menu class="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem v-for="link in links" :key="link.to" as-child>
            <RouterLink :to="link.to">{{ link.label }}</RouterLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div class="flex items-center gap-3">
      <LocaleSwitcher />
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger
          class="inline-flex size-7 items-center justify-center rounded-full bg-muted hover:bg-muted/70"
        >
          <User class="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="$emit('logout')">
            <LogOut class="size-3.5" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
