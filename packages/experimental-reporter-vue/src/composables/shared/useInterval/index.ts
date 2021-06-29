import { Pausable } from '@vueuse/core'
import { Ref, ref } from 'vue'
import { useIntervalFn } from '../useIntervalFn'

export interface IntervalOptions<Controls extends boolean> {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls

  /**
   * Exccute the update immediately on calling
   *
   * @default true
   */
  immediate?: boolean
}

export function useInterval(interval?: number, options?: IntervalOptions<false>): Ref<number>
export function useInterval(interval: number, options: IntervalOptions<true>): { counter: Ref<number> } & Pausable
export function useInterval(interval = 1000, options: IntervalOptions<boolean> = {}) {
  const {
    controls: exposeControls = false,
    immediate = true,
  } = options

  const counter = ref(0)
  const controls = useIntervalFn(() => counter.value += 1, interval, { immediate })

  if (exposeControls) {
    return {
      counter,
      ...controls,
    }
  }
  else {
    return counter
  }
}
