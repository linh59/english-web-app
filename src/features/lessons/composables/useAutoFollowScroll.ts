import type { Ref } from 'vue'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

// Ignore scroll deltas below this threshold before disabling auto-follow —
// layout shifts (translation line appearing/disappearing under the active
// sentence, the sticky bar's own height changing) can trigger a real `scroll`
// event via the browser's scroll-anchoring even though the user never
// touched anything, which used to disable auto-follow for no real reason.
const SCROLL_DISABLE_THRESHOLD_PX = 24

// Auto-scrolls the window so the active (currently playing) sentence stays
// near the top of the reading area, and turns itself off the moment the
// learner scrolls manually (e.g. to read ahead) — re-enabled via the
// `jumpToActive` button the page renders when `autoFollow` is false.
//
// Takes the sticky header's template ref rather than creating and returning
// one itself — the page owns `ref="stickyRef"` directly so Vue's
// script-setup tooling can link the template binding to it (a ref returned
// from a composable and destructured isn't recognized as "used" by that
// binding alone).
export function useAutoFollowScroll(activeSentenceId: Ref<string | undefined>, stickyRef: Ref<HTMLElement | undefined>) {
  const stickyHeight = ref(0)
  const autoFollow = ref(true)

  let isProgrammaticScroll = false
  let programmaticScrollTimer: number | undefined
  let lastKnownScrollY = 0

  // Re-measured via ResizeObserver rather than only on window resize, so
  // content-driven height changes (counter text length, the translate toggle
  // wrapping) don't leave scrollToSentence's math stale.
  function measureSticky() {
    stickyHeight.value = stickyRef.value?.getBoundingClientRect().height ?? 0
  }
  watch(stickyRef, (el) => {
    if (!el) return
    measureSticky()
    const observer = new ResizeObserver(measureSticky)
    observer.observe(el)
    onUnmounted(() => observer.disconnect())
  })

  function scrollToSentence(id: string) {
    const el = document.querySelector<HTMLElement>(`[data-sentence-id="${id}"]`)
    if (!el) return

    const rect = el.getBoundingClientRect()
    const viewportHeight = window.innerHeight - stickyHeight.value
    const targetY = stickyHeight.value + viewportHeight * 0.35
    const delta = rect.top - targetY
    if (Math.abs(delta) < 4) return

    isProgrammaticScroll = true
    window.scrollBy({ top: delta, behavior: 'smooth' })
    window.clearTimeout(programmaticScrollTimer)

    const stopProgrammaticScroll = () => {
      isProgrammaticScroll = false
      lastKnownScrollY = window.scrollY
    }
    // `scrollend` (when supported) fires exactly when the smooth-scroll
    // animation finishes; the fixed 600ms fallback timer can fire early on
    // slower devices and misattribute the tail of the animation to the user.
    // (The boolean is precomputed rather than checked inline in the `if` so
    // TS's `in`-narrowing doesn't collapse `window`'s type to `never` in the
    // else branch — `onscrollend` is a standard, always-present property on
    // Window's type even though runtime support still varies by browser.)
    const supportsScrollEnd = 'onscrollend' in window
    if (supportsScrollEnd) {
      window.addEventListener('scrollend', stopProgrammaticScroll, { once: true })
    } else {
      programmaticScrollTimer = window.setTimeout(stopProgrammaticScroll, 600)
    }
  }

  function onWindowScroll() {
    if (isProgrammaticScroll) return
    const scrollY = window.scrollY
    const delta = Math.abs(scrollY - lastKnownScrollY)
    lastKnownScrollY = scrollY
    if (delta < SCROLL_DISABLE_THRESHOLD_PX) return
    autoFollow.value = false
  }

  function jumpToActive() {
    autoFollow.value = true
    if (activeSentenceId.value) scrollToSentence(activeSentenceId.value)
  }

  // The active sentence's own height changes when the translation line
  // appears/disappears under it (previous active sentence loses it, new one
  // gains it), which shifts every element below it right as this scroll math
  // reads getBoundingClientRect() — wait for that layout to settle first so
  // the scroll target isn't computed against stale positions.
  watch(activeSentenceId, async (id) => {
    if (!id || !autoFollow.value) return
    await nextTick()
    scrollToSentence(id)
  })

  onMounted(() => {
    lastKnownScrollY = window.scrollY
    window.addEventListener('scroll', onWindowScroll, { passive: true })
  })
  onUnmounted(() => {
    window.removeEventListener('scroll', onWindowScroll)
    window.clearTimeout(programmaticScrollTimer)
  })

  return { stickyRef, autoFollow, jumpToActive }
}
