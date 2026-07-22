import type { Session, User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/shared/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function init() {
    if (initialized.value) return

    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })

    initialized.value = true
  }

  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    loading.value = false

    if (signUpError) {
      error.value = signUpError.message
      throw signUpError
    }

    return { needsEmailConfirmation: !data.session }
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    loading.value = false

    if (signInError) {
      error.value = signInError.message
      throw signInError
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, session, initialized, loading, error, init, signUp, signIn, signOut }
})
