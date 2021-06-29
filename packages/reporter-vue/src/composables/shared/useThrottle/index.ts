import { ref, Ref, watch } from 'vue'
import { useThrottleFn } from '../useThrottleFn'

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param  delay  A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 */
export function useThrottle<T>(value: Ref<T>, delay = 200) {
  if (delay <= 0)
    return value

  const throttled: Ref<T> = ref(value.value as T) as Ref<T>

  const updater = useThrottleFn(() => {
    throttled.value = value.value
  }, delay)

  watch(value, () => updater())

  return throttled
}
