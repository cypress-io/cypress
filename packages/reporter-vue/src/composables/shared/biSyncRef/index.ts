import { Ref, watch } from 'vue'

/**
 * Two-way refs synchronization.
 *
 * @param a
 * @param b
 */
export function biSyncRef<R extends Ref<any>>(a: R, b: R) {
  const flush = 'sync'

  const stop1 = watch(a, (newValue) => {
    b.value = newValue
  }, {
    flush,
    immediate: true,
  })

  const stop2 = watch(b, (newValue) => {
    a.value = newValue
  }, {
    flush,
    immediate: true,
  })

  return () => {
    stop1()
    stop2()
  }
}
