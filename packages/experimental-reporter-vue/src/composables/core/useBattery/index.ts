/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableNavigator, defaultNavigator } from '../_configurable'

export interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}

type NavigatorWithBattery = Navigator & {
  getBattery: () => Promise<BatteryManager>
}

/**
 * Reactive Battery Status API.
 *
 * @see https://vueuse.org/useBattery
 * @param options
 */
export function useBattery({ navigator = defaultNavigator }: ConfigurableNavigator = {}) {
  const events = ['chargingchange', 'chargingtimechange', 'dischargingtimechange', 'levelchange']

  const isSupported = navigator && 'getBattery' in navigator

  const charging = ref(false)
  const chargingTime = ref(0)
  const dischargingTime = ref(0)
  const level = ref(1)

  let battery: BatteryManager | null

  function updateBatteryInfo(this: BatteryManager) {
    charging.value = this.charging
    chargingTime.value = this.chargingTime || 0
    dischargingTime.value = this.dischargingTime || 0
    level.value = this.level
  }

  if (isSupported) {
    (navigator as NavigatorWithBattery)
      .getBattery()
      .then((_battery) => {
        battery = _battery
        updateBatteryInfo.call(battery)
        for (const event of events)
          useEventListener(battery, event, updateBatteryInfo, { passive: true })
      })
  }

  return {
    isSupported,
    charging,
    chargingTime,
    dischargingTime,
    level,
  }
}

export type UseBatteryReturn = ReturnType<typeof useBattery>
