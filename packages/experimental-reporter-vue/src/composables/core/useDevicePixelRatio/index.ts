import { ref, watch } from 'vue'
import { useEventListener } from '../useEventListener'
import { useMediaQuery } from '../useMediaQuery'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

// device pixel ratio statistics from https://www.mydevice.io/
const DEVICE_PIXEL_RATIO_SCALES = [
  1,
  1.325,
  1.4,
  1.5,
  1.8,
  2,
  2.4,
  2.5,
  2.75,
  3,
  3.5,
  4,
]
/**
 * Reactively track `window.devicePixelRatio`.
 *
 * @see https://vueuse.org/useDevicePixelRatio
 * @param options
 */
export function useDevicePixelRatio({
  window = defaultWindow,
}: ConfigurableWindow = {}) {
  if (!window) {
    return {
      pixelRatio: ref(1),
    }
  }

  const pixelRatio = ref(window.devicePixelRatio)

  const handleDevicePixelRatio = () => {
    pixelRatio.value = window.devicePixelRatio
  }

  useEventListener(window, 'resize', handleDevicePixelRatio, { passive: true })

  DEVICE_PIXEL_RATIO_SCALES.forEach((dppx) => {
    // listen mql events in both sides
    const mqlMin = useMediaQuery(`screen and (min-resolution: ${dppx}dppx)`)
    const mqlMax = useMediaQuery(`screen and (max-resolution: ${dppx}dppx)`)

    watch([mqlMin, mqlMax], handleDevicePixelRatio)
  })

  return { pixelRatio }
}

export type UseDevicePixelRatioReturn = ReturnType<typeof useDevicePixelRatio>
