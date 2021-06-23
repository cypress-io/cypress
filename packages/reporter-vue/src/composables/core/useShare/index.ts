import { MaybeRef } from '../../shared'
import { unref } from 'vue'
import { ConfigurableNavigator, defaultNavigator } from '../_configurable'

export interface ShareOptions {
  title?: string
  files?: File[]
  text?: string
  url?: string
}

interface NavigatorWithShare {
  share?: (data: ShareOptions) => Promise<void>
  canShare?: (data: ShareOptions) => boolean
}

/**
 * Reactive Web Share API.
 *
 * @see https://vueuse.org/useShare
 * @param shareOptions
 * @param options
 */
export function useShare(shareOptions: MaybeRef<ShareOptions> = {}, options: ConfigurableNavigator = {}) {
  const { navigator = defaultNavigator } = options

  const _navigator = (navigator as NavigatorWithShare)
  const isSupported = _navigator && 'canShare' in _navigator

  const share = async(overrideOptions: MaybeRef<ShareOptions> = {}) => {
    if (isSupported) {
      const data = {
        ...unref(shareOptions),
        ...unref(overrideOptions),
      }
      let granted = true

      if (data.files && _navigator.canShare)
        granted = _navigator.canShare({ files: data.files })

      if (granted)
        return _navigator.share!(data)
    }
  }

  return {
    isSupported,
    share,
  }
}

export type UseShareReturn = ReturnType<typeof useShare>
