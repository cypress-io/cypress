import { ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

/**
 * Reactive state to show whether mouse leaves the page.
 *
 * @see https://vueuse.org/usePageLeave
 * @param options
 */
export function usePageLeave(options: ConfigurableWindow = {}) {
  const { window = defaultWindow } = options
  const isLeft = ref(false)

  const handler = (event: MouseEvent) => {
    if (!window)
      return

    event = event || (window.event as any)
    // @ts-ignore
    const from = event.relatedTarget || event.toElement
    isLeft.value = !from
  }

  if (window) {
    useEventListener(window, 'mouseout', handler, { passive: true })
    useEventListener(window.document, 'mouseleave', handler, { passive: true })
    useEventListener(window.document, 'mouseenter', handler, { passive: true })
  }

  return isLeft
}
