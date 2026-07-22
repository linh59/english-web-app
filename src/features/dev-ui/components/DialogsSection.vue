<script setup lang="ts">
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <Dialog>
      <DialogTrigger as-child>
        <Button variant="outline">Confirm</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave this lesson?</DialogTitle>
          <DialogDescription>Your progress will be saved automatically.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost">Stay</Button>
          <Button>Leave</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog>
      <DialogTrigger as-child>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this lesson?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog>
      <DialogTrigger as-child>
        <Button variant="secondary">Info</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About processing</DialogTitle>
          <DialogDescription>
            Long audio is split into chunks before transcription. This can take a few minutes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
