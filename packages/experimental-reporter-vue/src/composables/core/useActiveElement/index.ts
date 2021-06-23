import { computed, ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

/**
 * Reactive `document.activeElement`
 *
 * @see https://vueuse.org/useActiveElement
 * @param options
 */
export function useActiveElement<T extends HTMLElement>(options: ConfigurableWindow = {}) {
  const { window = defaultWindow } = options
  const counter = ref(0)

  if (window) {
    useEventListener(window, 'blur', () => counter.value += 1, true)
    useEventListener(window, 'focus', () => counter.value += 1, true)
  }

  return computed(() => {
    // eslint-disable-next-line no-unused-expressions
    counter.value
    if (window && window.document) {
      return window.document.activeElement as T | null | undefined
    }
    return null
  })
}
