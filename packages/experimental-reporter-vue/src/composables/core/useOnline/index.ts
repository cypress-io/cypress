import { useNetwork } from '../useNetwork'
import { ConfigurableWindow } from '../_configurable'

/**
 * Reactive online state.
 *
 * @see https://vueuse.org/useOnline
 * @param options
 */
export function useOnline(options: ConfigurableWindow = {}) {
  const { isOnline } = useNetwork(options)
  return isOnline
}
