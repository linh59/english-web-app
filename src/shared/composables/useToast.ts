import { ref } from 'vue'

export type ToastVariant = 'success' | 'destructive'

export interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
}

const DISMISS_AFTER_MS = 4000

const toasts = ref<ToastItem[]>([])
let nextId = 0

function dismiss(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function push(variant: ToastVariant, message: string) {
  const id = nextId++
  toasts.value.push({ id, variant, message })
  setTimeout(() => dismiss(id), DISMISS_AFTER_MS)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message: string) => push('success', message),
    error: (message: string) => push('destructive', message),
  }
}
