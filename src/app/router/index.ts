import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/features/auth/pages/LoginPage.vue') },
  { path: '/signup', name: 'signup', component: () => import('@/features/auth/pages/SignupPage.vue') },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/features/auth/pages/ForgotPasswordPage.vue'),
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/features/auth/pages/ResetPasswordPage.vue'),
  },
  {
    path: '/',
    component: () => import('@/app/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: 'library' },
      { path: 'library', name: 'library', component: () => import('@/features/lessons/pages/LibraryPage.vue') },
      {
        path: 'lessons/:id',
        name: 'lesson-study',
        component: () => import('@/features/lessons/pages/LessonStudyPage.vue'),
        props: true,
      },
      { path: 'vocabulary', name: 'vocabulary', component: () => import('@/features/vocabulary/pages/VocabularyPage.vue') },
    ],
  },
]

if (import.meta.env.DEV) {
  routes.push({
    path: '/ui',
    name: 'ui-showcase',
    component: () => import('@/features/dev-ui/pages/UiShowcasePage.vue'),
  })
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.init()
  }

  const isAuthed = !!authStore.user
  if (to.meta.requiresAuth && !isAuthed) {
    return { name: 'login' }
  }
  if ((to.name === 'login' || to.name === 'signup') && isAuthed) {
    return { name: 'library' }
  }
})
