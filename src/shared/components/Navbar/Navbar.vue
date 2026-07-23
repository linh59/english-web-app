<script setup lang="ts">
import { LogOut, User } from '@lucide/vue'
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
