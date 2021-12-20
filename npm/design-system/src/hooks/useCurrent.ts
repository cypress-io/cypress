import { useLayoutEffect, useRef } from 'react'

/**
 * Wraps the provided `value` in a Concurrent safe ref for consumption in `useEffect` and similar without forcing reruns on value changes
 *
 * **CAUTION:** `useCurrent` makes it easy to shoot yourself in the foot, particularly in scenarios involving callbacks. Use sparingly
 */
export const useCurrent = <T>(value: T) => {
  const ref = useRef(value)

  useLayoutEffect(() => {
    ref.current = value
  }, [value])

  return ref
}
