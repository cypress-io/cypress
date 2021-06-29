import { getCurrentInstance, onMounted, onUpdated, customRef, Ref } from 'vue'

/**
 * Shorthand for binding ref to template element.
 *
 * @see https://vueuse.org/templateRef
 * @param key
 * @param initialValue
 */
export function templateRef<T extends Element | null>(
  key: string,
  initialValue: T | null = null,
): Readonly<Ref<T>> {
  const instance = getCurrentInstance()
  let _trigger = () => {}

  const element = customRef((track, trigger) => {
    _trigger = trigger
    return {
      get() {
        track()
        if (instance && instance.proxy && instance.proxy.$refs[key]) {
          return initialValue
        }
      },
      set() {},
    }
  })

  onMounted(_trigger)
  onUpdated(_trigger)

  return element as Readonly<Ref<T>>
}
