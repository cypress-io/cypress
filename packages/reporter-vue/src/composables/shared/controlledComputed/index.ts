import { ComputedRef, customRef, ref, watch, WatchSource } from 'vue'
import { Fn } from '../utils'

/**
 * Explicitly define the deps of computed.
 *
 * @param source
 * @param fn
 */
export function controlledComputed<T, S>(source: WatchSource<S>, fn: () => T) {
  let v: T = undefined!
  let track: Fn
  let trigger: Fn
  const dirty = ref(true)

  watch(
    source,
    () => {
      dirty.value = true
      trigger()
    },
    { flush: 'sync' },
  )

  return customRef<T>((_track, _trigger) => {
    track = _track
    trigger = _trigger

    return {
      get() {
        if (dirty.value) {
          v = fn()
          dirty.value = false
        }
        track()
        return v
      },
      set() {},
    }
  }) as ComputedRef<T>
}
