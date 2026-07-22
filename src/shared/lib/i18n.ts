import { createI18n, useI18n } from 'vue-i18n'

export const SUPPORTED_LOCALES = ['en', 'vi'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'locale'

type LocaleMessages = Record<string, unknown>
type MessagesByLocale = Record<Locale, Record<string, LocaleMessages>>

const sharedModules = import.meta.glob('../locales/*.json', { eager: true }) as Record<
  string,
  { default: LocaleMessages }
>
const featureModules = import.meta.glob('../../features/*/locales/*.json', { eager: true }) as Record<
  string,
  { default: LocaleMessages }
>

function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function buildMessages(): MessagesByLocale {
  const messages = {} as MessagesByLocale
  for (const locale of SUPPORTED_LOCALES) {
    messages[locale] = { common: {} }
  }

  for (const [path, mod] of Object.entries(sharedModules)) {
    const match = path.match(/\/locales\/([a-z]{2})\.json$/)
    if (!match) continue
    const locale = match[1]
    if (!isSupportedLocale(locale)) continue
    messages[locale].common = mod.default
  }

  for (const [path, mod] of Object.entries(featureModules)) {
    const match = path.match(/features\/([^/]+)\/locales\/([a-z]{2})\.json$/)
    if (!match) continue
    const [, feature, locale] = match
    if (!isSupportedLocale(locale)) continue
    messages[locale][feature] = mod.default
  }

  return messages
}

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && isSupportedLocale(stored)) return stored
  const browserLocale = navigator.language.slice(0, 2)
  return isSupportedLocale(browserLocale) ? browserLocale : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: buildMessages(),
})

export function useLocale() {
  const { locale } = useI18n({ useScope: 'global' })

  function setLocale(next: Locale) {
    locale.value = next
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { locale, setLocale, availableLocales: SUPPORTED_LOCALES }
}
