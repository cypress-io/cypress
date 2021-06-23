import { MaybeRef } from '../utils'
import { computed, ComputedRef, unref } from 'vue'

/**
 * `OR` conditions for refs.
 *
 * @see https://vueuse.org/or
 */
export function or(...args: MaybeRef<any>[]): ComputedRef<boolean> {
  return computed(() => args.some(i => unref(i)))
}
