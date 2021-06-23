import { unref } from 'vue'
import { MaybeRef } from '../utils'

/**
 * Shorthand for accessing `ref.value`
 */
export function get<T>(ref: MaybeRef<T>): T
export function get<T, K extends keyof T>(ref: MaybeRef<T>, key: K): T[K]

export function get(obj: MaybeRef<any>, key?: string | number | symbol) {
  if (key == null)
    return unref(obj)

  return unref(obj)[key]
}
