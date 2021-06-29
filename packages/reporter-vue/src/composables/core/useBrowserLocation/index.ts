/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export interface BrowserLocationState {
  trigger: string
  state?: any
  length?: number
  hash?: string
  host?: string
  hostname?: string
  href?: string
  origin?: string
  pathname?: string
  port?: string
  protocol?: string
  search?: string
}

/**
 * Reactive browser location.
 *
 * @see https://vueuse.org/useBrowserLocation
 * @param options
 */
export function useBrowserLocation({ window = defaultWindow }: ConfigurableWindow = {}) {
  const buildState = (trigger: string): BrowserLocationState => {
    const { state, length } = window && window.history || {}
    const { hash, host, hostname, href, origin, pathname, port, protocol, search } = window && window.location || {}

    return {
      trigger,
      state,
      length,
      hash,
      host,
      hostname,
      href,
      origin,
      pathname,
      port,
      protocol,
      search,
    }
  }

  const state = ref(buildState('load'))

  if (window) {
    useEventListener(window, 'popstate', () => state.value = buildState('popstate'), { passive: true })
    useEventListener(window, 'hashchange', () => state.value = buildState('hashchange'), { passive: true })
  }

  return state
}

export type UseBrowserLocationReturn = ReturnType<typeof useBrowserLocation>
