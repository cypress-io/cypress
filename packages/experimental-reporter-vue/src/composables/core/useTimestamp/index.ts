import { Pausable, timestamp, useIntervalFn } from '../../shared'
import { Ref, ref } from 'vue'
import { useRafFn } from '../useRafFn'

export interface TimestampOptions<Controls extends boolean> {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls

  /**
   * Offset value adding to the value
   *
   * @default 0
   */
  offset?: number

  /**
   * Update interval, or use requestAnimationFrame
   *
   * @default requestAnimationFrame
   */
  interval?: 'requestAnimationFrame' | number
}

/**
 * Reactive current timestamp.
 *
 * @see https://vueuse.org/useTimestamp
 * @param options
 */
export function useTimestamp(options?: TimestampOptions<false>): Ref<number>
export function useTimestamp(options: TimestampOptions<true>): { timestamp: Ref<number> } & Pausable
export function useTimestamp(options: TimestampOptions<boolean> = {}) {
  const {
    controls: exposeControls = false,
    offset = 0,
    interval = 'requestAnimationFrame',
  } = options

  const ts = ref(timestamp() + offset)

  const update = () => ts.value = timestamp() + offset

  const controls: Pausable = interval === 'requestAnimationFrame'
    ? useRafFn(update, { immediate: true })
    : useIntervalFn(update, interval, { immediate: true })

  if (exposeControls) {
    return {
      timestamp: ts,
      ...controls,
    }
  }
  else {
    return ts
  }
}

export type UseTimestampReturn = ReturnType<typeof useTimestamp>
