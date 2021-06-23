import { isRef, ToRefs, toRefs as _toRefs, computed } from 'vue'
import { MaybeRef } from '../../shared'

/**
 * Extended `toRefs` that also accepts refs of an object.
 *
 * @see https://vueuse.org/toRefs
 * @param objectRef A ref or normal object or array.
 */
export function toRefs<T extends object>(
  objectRef: MaybeRef<T>,
): ToRefs<T> {
  if (!isRef(objectRef))
    return _toRefs(objectRef)

  const ret: any = Array.isArray(objectRef.value)
    ? new Array(objectRef.value.length)
    : {}

  // eslint-disable-next-line no-restricted-syntax
  for (const key in objectRef.value) {
    ret[key] = computed<T[typeof key]>({
      get() {
        return objectRef.value[key]
      },
      set(v) {
        objectRef.value[key] = v
      },
    })
  }
  return ret
}
