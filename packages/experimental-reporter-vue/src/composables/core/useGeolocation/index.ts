/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { ref, Ref } from 'vue'
import { tryOnMounted, tryOnUnmounted } from '../../shared'
import { ConfigurableNavigator, defaultNavigator } from '../_configurable'

export interface GeolocationOptions extends Partial<PositionOptions>, ConfigurableNavigator {}

/**
 * Reactive Geolocation API.
 *
 * @see https://vueuse.org/useGeolocation
 * @param options
 */
export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    maximumAge = 30000,
    timeout = 27000,
    navigator = defaultNavigator,
  } = options

  const isSupported = navigator && 'geolocation' in navigator

  const locatedAt: Ref<number | null> = ref(null)
  const error = ref<GeolocationPositionError | null>(null)
  const coords: Ref<GeolocationPosition['coords']> = ref({
    accuracy: 0,
    latitude: 0,
    longitude: 0,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  })

  function updatePosition(position: GeolocationPosition) {
    locatedAt.value = position.timestamp
    coords.value = position.coords
    error.value = null
  }

  let watcher: number

  tryOnMounted(() => {
    if (isSupported) {
      watcher = navigator!.geolocation.watchPosition(
        updatePosition,
        err => error.value = err,
        {
          enableHighAccuracy,
          maximumAge,
          timeout,
        },
      )
    }
  })

  tryOnUnmounted(() => {
    if (watcher && navigator)
      navigator.geolocation.clearWatch(watcher)
  })

  return {
    isSupported,
    coords,
    locatedAt,
    error,
  }
}

export type UseGeolocationReturn = ReturnType<typeof useGeolocation>
