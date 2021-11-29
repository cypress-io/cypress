export type NonNullable <T> = T extends null | undefined ? never : T

/**
 * The entire object can be optional, except for a few members
 */
export type Ensure<T, Props extends keyof T> = Partial<T> & Pick<T, Props>

/**
 *
 */
export function isPromiseLike <V> (val: PromiseLike<V> | any): val is PromiseLike<V> {
  return Boolean(val && typeof val.then === 'function')
}
