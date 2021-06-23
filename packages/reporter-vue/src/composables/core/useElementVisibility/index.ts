import { tryOnMounted } from '../../shared'
import { ref, Ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export interface VisibilityScrollTargetOptions extends ConfigurableWindow {
  scrollTarget?: Ref<Element | null | undefined>
}

/**
 * Tracks the visibility of an element within the viewport.
 *
 * @see https://vueuse.org/useElementVisibility
 * @param element
 * @param options
 */
export function useElementVisibility(
  element: Ref<Element|null|undefined>,
  { window = defaultWindow, scrollTarget }: VisibilityScrollTargetOptions = {},
) {
  const elementIsVisible = ref(false)

  const testBounding = () => {
    if (!window)
      return

    const document = window.document
    if (!element.value) {
      elementIsVisible.value = false
    }
    else {
      const rect = element.value.getBoundingClientRect()

      elementIsVisible.value = (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight)
          && rect.left <= (window.innerWidth || document.documentElement.clientWidth)
          && rect.bottom >= 0
          && rect.right >= 0
      )
    }
  }

  tryOnMounted(testBounding)

  if (window)
    tryOnMounted(() => useEventListener(scrollTarget && scrollTarget.value || window, 'scroll', testBounding, { capture: false, passive: true }))

  return elementIsVisible
}
