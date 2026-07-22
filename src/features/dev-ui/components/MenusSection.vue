<script setup lang="ts">
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
</script>

<template>
  <div class="flex flex-wrap items-center gap-4">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline">Dropdown</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Popover>
      <PopoverTrigger as-child>
        <Button variant="outline">Popover</Button>
      </PopoverTrigger>
      <PopoverContent class="text-sm text-foreground">
        This is a popover, used by the Vocabulary Popup when selecting text.
      </PopoverContent>
    </Popover>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Tooltip content</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
