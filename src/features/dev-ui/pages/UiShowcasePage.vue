<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AlertsSection from '../components/AlertsSection.vue'
import AudioPlayerSection from '../components/AudioPlayerSection.vue'
import BadgesSection from '../components/BadgesSection.vue'
import ButtonSection from '../components/ButtonSection.vue'
import CardsSection from '../components/CardsSection.vue'
import ColorsSection from '../components/ColorsSection.vue'
import DialogsSection from '../components/DialogsSection.vue'
import EmptyStatesSection from '../components/EmptyStatesSection.vue'
import IconsSection from '../components/IconsSection.vue'
import InputSection from '../components/InputSection.vue'
import LessonCardSection from '../components/LessonCardSection.vue'
import LoadingSection from '../components/LoadingSection.vue'
import MenusSection from '../components/MenusSection.vue'
import NavbarSection from '../components/NavbarSection.vue'
import ProgressSection from '../components/ProgressSection.vue'
import ShowcaseSection from '../components/ShowcaseSection.vue'
import SidebarNav from '../components/SidebarNav.vue'
import TokensSection from '../components/TokensSection.vue'
import TranscriptSection from '../components/TranscriptSection.vue'
import TypographySection from '../components/TypographySection.vue'
import VocabularySection from '../components/VocabularySection.vue'

const { t } = useI18n({ useScope: 'global' })

const SECTION_ORDER = [
  { id: 'colors', component: ColorsSection },
  { id: 'typography', component: TypographySection },
  { id: 'tokens', component: TokensSection },
  { id: 'buttons', component: ButtonSection },
  { id: 'inputs', component: InputSection },
  { id: 'cards', component: CardsSection },
  { id: 'badges', component: BadgesSection },
  { id: 'alerts', component: AlertsSection },
  { id: 'dialogs', component: DialogsSection },
  { id: 'menus', component: MenusSection },
  { id: 'navbar', component: NavbarSection },
  { id: 'loading', component: LoadingSection },
  { id: 'emptyState', component: EmptyStatesSection },
  { id: 'icons', component: IconsSection },
  { id: 'lessonCard', component: LessonCardSection },
  { id: 'audioPlayer', component: AudioPlayerSection },
  { id: 'transcript', component: TranscriptSection },
  { id: 'vocabulary', component: VocabularySection },
  { id: 'progress', component: ProgressSection },
] as const

const sections = computed(() =>
  SECTION_ORDER.map((s) => ({
    id: s.id,
    component: s.component,
    title: t(`dev-ui.sections.${s.id}.title`),
    description: t(`dev-ui.sections.${s.id}.description`),
  })),
)
</script>

<template>
  <div>
    <header class="sticky top-0 z-dropdown flex h-14 items-center border-b border-border bg-background px-4">
      <h1 class="text-sm font-semibold text-foreground">{{ t('dev-ui.pageTitle') }}</h1>
      <span class="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">dev only</span>
    </header>

    <div class="flex">
      <SidebarNav
        :sections="sections"
        :search-placeholder="t('dev-ui.searchPlaceholder')"
        :no-results-label="t('dev-ui.noResults')"
      />

      <main class="min-w-0 flex-1 space-y-10 p-4 sm:p-8">
        <ShowcaseSection
          v-for="section in sections"
          :key="section.id"
          :section-id="section.id"
          :title="section.title"
          :description="section.description"
        >
          <component :is="section.component" />
        </ShowcaseSection>
      </main>
    </div>
  </div>
</template>
