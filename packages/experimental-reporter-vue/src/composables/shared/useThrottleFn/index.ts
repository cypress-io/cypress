import { createFilterWrapper, FunctionArgs, throttleFilter, MaybeRef } from '../utils'

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param   fn             A function to be executed after delay milliseconds. The `this` context and all arguments are passed through, as-is,
 *                                    to `callback` when the throttled-function is executed.
 * @param   ms             A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 *
 * @return  A new, throttled, function.
 */
export function useThrottleFn<T extends FunctionArgs>(fn: T, ms: MaybeRef<number> = 200, trailing = true): T {
  return createFilterWrapper(
    throttleFilter(ms, trailing),
    fn,
  )
}
