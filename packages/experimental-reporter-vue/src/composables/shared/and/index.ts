import { MaybeRef } from '../utils'
import { computed, ComputedRef, unref } from 'vue'

/**
 * `AND` conditions for refs.
 *
 * @see https://vueuse.org/and
 */
export function and(...args: MaybeRef<any>[]): ComputedRef<boolean> {
  return computed(() => args.every(i => unref(i)))
}
