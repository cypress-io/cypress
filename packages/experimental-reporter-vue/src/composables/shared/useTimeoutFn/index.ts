import { ref, unref } from 'vue'
import { tryOnUnmounted } from '../tryOnUnmounted'
import { isClient, MaybeRef, Stopable } from '../utils'

export interface TimeoutFnOptions {
  /**
   * Execute the callback immediate after calling this function
   *
   * @default true
   */
  immediate?: boolean
}

/**
 * Wrapper for `setTimeout` with controls.
 *
 * @param cb
 * @param interval
 * @param immediate
 */
export function useTimeoutFn(
  cb: (...args: unknown[]) => any,
  interval: MaybeRef<number>,
  options: TimeoutFnOptions = {},
): Stopable {
  const {
    immediate = true,
  } = options

  const isPending = ref(false)

  let timer: number | null = null

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function stop() {
    isPending.value = false
    clear()
  }

  function start(...args: unknown[]) {
    clear()
    isPending.value = true
    timer = setTimeout(() => {
      isPending.value = false
      timer = null
      // eslint-disable-next-line node/no-callback-literal
      cb(...args)
    }, unref(interval)) as unknown as number
  }

  if (immediate) {
    isPending.value = true
    if (isClient)
      start()
  }

  tryOnUnmounted(stop)

  return {
    isPending,
    start,
    stop,
  }
}
