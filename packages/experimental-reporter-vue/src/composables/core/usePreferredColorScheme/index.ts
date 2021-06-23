import { computed } from 'vue'
import { useMediaQuery } from '../useMediaQuery'
import { ConfigurableWindow } from '../_configurable'

export type ColorSchemeType = 'dark' | 'light' | 'no-preference'

/**
 * Reactive prefers-color-scheme media query.
 *
 * @see https://vueuse.org/usePreferredColorScheme
 * @param [options]
 */
export function usePreferredColorScheme(options?: ConfigurableWindow) {
  const isLight = useMediaQuery('(prefers-color-scheme: light)', options)
  const isDark = useMediaQuery('(prefers-color-scheme: dark)', options)

  return computed<ColorSchemeType>(() => {
    if (isDark.value)
      return 'dark'
    if (isLight.value)
      return 'light'
    return 'no-preference'
  })
}
