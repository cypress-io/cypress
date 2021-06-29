import { ref } from 'vue'
import { tryOnUnmounted } from '../tryOnUnmounted'
import { Pausable, Fn, isClient } from '../utils'

export interface IntervalFnOptions {
  /**
   * Execute the callback immediate after calling this function
   *
   * @default true
   */
  immediate?: boolean
}

/**
 * Wrapper for `setInterval` with controls
 *
 * @param cb
 * @param interval
 * @param options
 */
export function useIntervalFn(cb: Fn, interval = 1000, options: IntervalFnOptions = {}): Pausable {
  const {
    immediate = true,
  } = options

  let timer: any = null
  const isActive = ref(false)

  function clean() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function pause() {
    isActive.value = false
    clean()
  }

  function resume() {
    if (interval <= 0)
      return
    isActive.value = true
    clean()
    timer = setInterval(cb, interval)
  }

  if (immediate && isClient)
    resume()

  tryOnUnmounted(pause)

  return {
    isActive,
    pause,
    resume,
  }
}
