import { computed, ComputedRef, unref } from 'vue'
import { MaybeRef } from '../utils'

export type Reactify<T> = T extends (...args: infer A) => infer R
  ? (...args: { [K in keyof A]: MaybeRef<A[K]> }) => ComputedRef<R>
  : never

/**
 * Converts plain function into a reactive function.
 * The converted function accepts refs as it's arguments
 * and returns a ComputedRef, with proper typing.
 *
 * @param fn - Source function
 */
export function reactify<T extends Function>(fn: T): Reactify<T> {
  return function(this: any, ...args: any[]) {
    return computed(() => fn.apply(this, args.map(i => unref(i))))
  } as Reactify<T>
}
