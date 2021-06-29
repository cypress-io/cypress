import { MaybeRef } from '../utils'
import { computed, ComputedRef, unref } from 'vue'

/**
 * `NOT` conditions for refs.
 *
 * @see https://vueuse.org/not
 */
export function not(v: MaybeRef<any>): ComputedRef<boolean> {
  return computed(() => !unref(v))
}
