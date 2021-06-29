/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { ref } from 'vue'
import { tryOnUnmounted } from '../../shared'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

/**
 * Reactive Media Query.
 *
 * @see https://vueuse.org/useMediaQuery
 * @param query
 * @param options
 */
export function useMediaQuery(query: string, options: ConfigurableWindow = {}) {
  const { window = defaultWindow } = options
  if (!window)
    return ref(false)

  const mediaQuery = window.matchMedia(query)
  const matches = ref(mediaQuery.matches)

  const handler = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }

  if ('addEventListener' in mediaQuery)
    mediaQuery.addEventListener('change', handler)
  else
    mediaQuery.addListener(handler)

  tryOnUnmounted(() => {
    if ('removeEventListener' in mediaQuery)
      mediaQuery.removeEventListener('change', handler)
    else
      mediaQuery.removeListener(handler)
  })

  return matches
}
