import { createPinia } from 'pinia'
import { createApp } from 'vue'
import '@/shared/styles/tokens.css'
import '@/shared/composables/useTheme'
import { i18n } from '@/shared/lib/i18n'
import { router } from './router'
import App from './App.vue'

createApp(App).use(createPinia()).use(i18n).use(router).mount('#app')
