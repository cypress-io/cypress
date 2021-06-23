/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { bypassFilter, ConfigurableEventFilter, createFilterWrapper } from '../../shared'
import { ref, Ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export interface DeviceMotionOptions extends ConfigurableWindow, ConfigurableEventFilter {}

/**
 * Reactive DeviceMotionEvent.
 *
 * @see https://vueuse.org/useDeviceMotion
 * @param options
 */
export function useDeviceMotion(options: DeviceMotionOptions = {}) {
  const {
    window = defaultWindow,
    eventFilter = bypassFilter,
  } = options

  const acceleration: Ref<DeviceMotionEvent['acceleration']> = ref({ x: null, y: null, z: null })
  const rotationRate: Ref<DeviceMotionEvent['rotationRate']> = ref({ alpha: null, beta: null, gamma: null })
  const interval = ref(0)
  const accelerationIncludingGravity: Ref<DeviceMotionEvent['accelerationIncludingGravity']> = ref({
    x: null,
    y: null,
    z: null,
  })

  if (window) {
    const onDeviceMotion = createFilterWrapper(
      eventFilter,
      (event: DeviceMotionEvent) => {
        acceleration.value = event.acceleration
        accelerationIncludingGravity.value = event.accelerationIncludingGravity
        rotationRate.value = event.rotationRate
        interval.value = event.interval
      },
    )

    useEventListener(window, 'devicemotion', onDeviceMotion)
  }

  return {
    acceleration,
    accelerationIncludingGravity,
    rotationRate,
    interval,
  }
}

export type UseDeviceMotionReturn = ReturnType<typeof useDeviceMotion>
