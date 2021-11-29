/**
 * The entire object can be optional, except for a few members
 */
import type Observable from 'zen-observable'

export type NonNullable <T> = T extends null | undefined ? never : T

export type Ensure<T, Props extends keyof T> = Partial<T> & Pick<T, Props>

export function isObservable <V> (val: Observable<V> | any): val is Observable<V> {
  if (!val) {
    return false
  }

  if (typeof Symbol.observable === 'symbol' && typeof val[Symbol.observable] === 'function') {
    return val === val[Symbol.observable]()
  }

  if (typeof val['@@observable'] === 'function') {
    return val === val['@@observable']()
  }

  return false
}

export function isPromiseLike <V> (val: PromiseLike<V> | any): val is PromiseLike<V> {
  return Boolean(val && typeof val.then === 'function')
}
