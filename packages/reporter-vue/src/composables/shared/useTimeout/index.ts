import { computed, ComputedRef } from 'vue'
import { useTimeoutFn, TimeoutFnOptions } from '../useTimeoutFn'
import { noop, Stopable } from '../utils'

export interface TimeoutOptions<Controls extends boolean> extends TimeoutFnOptions {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls
}

/**
 * Update value after a given time with controls.
 *
 * @see   {@link https://vueuse.org/useTimeout}
 * @param interval
 * @param immediate
 */
export function useTimeout(interval?: number, options?: TimeoutOptions<false>): ComputedRef<boolean>
export function useTimeout(interval: number, options: TimeoutOptions<true>): { ready: ComputedRef<boolean> } & Stopable
export function useTimeout(interval = 1000, options: TimeoutOptions<boolean> = {}) {
  const {
    controls: exposeControls = false,
  } = options

  const controls = useTimeoutFn(
    noop,
    interval,
    options,
  )

  const ready = computed(() => !controls.isPending.value)

  if (exposeControls) {
    return {
      ready,
      ...controls,
    }
  }
  else {
    return ready
  }
}
