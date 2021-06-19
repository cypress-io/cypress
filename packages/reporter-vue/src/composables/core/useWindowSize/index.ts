import { ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export interface WindowSizeOptions extends ConfigurableWindow {
  initialWidth?: number
  initialHeight?: number
}

/**
 * Reactive window size.
 *
 * @see https://vueuse.org/useWindowSize
 * @param options
 */
export function useWindowSize({ window = defaultWindow, initialWidth = Infinity, initialHeight = Infinity }: WindowSizeOptions = {}) {
  if (!window) {
    return {
      width: ref(initialWidth),
      height: ref(initialHeight),
    }
  }
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  useEventListener('resize', () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }, { passive: true })

  return { width, height }
}

export type UseWindowSizeReturn = ReturnType<typeof useWindowSize>
