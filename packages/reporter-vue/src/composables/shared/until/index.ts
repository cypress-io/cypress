import { WatchOptions, watch, WatchSource, unref } from 'vue'
import { ElementOf, promiseTimeout, ShallowUnwrapRef, MaybeRef } from '../utils'

export interface UntilToMatchOptions {
  /**
   * Milliseconds timeout for promise to resolve/reject if the when condition does not meet.
   * 0 for never timed out
   *
   * @default 0
   */
  timeout?: number

  /**
   * Reject the promise when timeout
   *
   * @default false
   */
  throwOnTimeout?: boolean

  /**
   * `flush` option for internal watch
   *
   * @default 'sync'
   */
  flush?: WatchOptions['flush']

  /**
   * `deep` option for internal watch
   *
   * @default 'false'
   */
  deep?: WatchOptions['deep']
}

export interface UntilBaseInstance<T> {
  toMatch(
    condition: (v: T) => boolean,
    options?: UntilToMatchOptions
  ): Promise<void>
  changed(options?: UntilToMatchOptions): Promise<void>
  changedTimes(n?: number, options?: UntilToMatchOptions): Promise<void>
}

export interface UntilValueInstance<T> extends UntilBaseInstance<T> {
  readonly not: UntilValueInstance<T>

  toBe<P = T>(value: MaybeRef<T | P>, options?: UntilToMatchOptions): Promise<void>
  toBeTruthy(options?: UntilToMatchOptions): Promise<void>
  toBeNull(options?: UntilToMatchOptions): Promise<void>
  toBeUndefined(options?: UntilToMatchOptions): Promise<void>
  toBeNaN(options?: UntilToMatchOptions): Promise<void>
}

export interface UntilArrayInstance<T> extends UntilBaseInstance<T> {
  readonly not: UntilArrayInstance<T>

  toContains(value: MaybeRef<ElementOf<ShallowUnwrapRef<T>>>, options?: UntilToMatchOptions): Promise<void>
}

/**
 * Promised one-time watch for changes
 *
 * @see https://vueuse.org/until
 * @example
 * ```
 * const { count } = useCounter()
 *
 * await until(count).toMatch(v => v > 7)
 *
 * alert('Counter is now larger than 7!')
 * ```
 */
export function until<T extends unknown[]>(r: WatchSource<T> | MaybeRef<T>): UntilArrayInstance<T>
export function until<T>(r: WatchSource<T> | MaybeRef<T>): UntilValueInstance<T>
export function until<T>(r: any): any {
  let isNot = false

  function toMatch(
    condition: (v: any) => boolean,
    { flush = 'sync', deep = false, timeout, throwOnTimeout }: UntilToMatchOptions = {},
  ): Promise<void> {
    let stop: Function | null = null
    const watcher = new Promise<void>((resolve) => {
      stop = watch(
        r,
        (v) => {
          if (condition(v) === !isNot) {
            stop && stop()
            resolve()
          }
        },
        {
          flush,
          deep,
          immediate: true,
        },
      )
    })

    const promises = [watcher]
    if (timeout) {
      promises.push(
        promiseTimeout(timeout, throwOnTimeout).finally(() => {
          stop && stop()
        }),
      )
    }

    return Promise.race(promises)
  }

  function toBe<P>(value: MaybeRef<P | T>, options?: UntilToMatchOptions) {
    return toMatch(v => v === unref(value), options)
  }

  function toBeTruthy(options?: UntilToMatchOptions) {
    return toMatch(v => Boolean(v), options)
  }

  function toBeNull(options?: UntilToMatchOptions) {
    return toBe<null>(null, options)
  }

  function toBeUndefined(options?: UntilToMatchOptions) {
    return toBe<undefined>(undefined, options)
  }

  function toBeNaN(options?: UntilToMatchOptions) {
    return toMatch(Number.isNaN, options)
  }

  function toContains(
    value: any,
    options?: UntilToMatchOptions,
  ) {
    return toMatch((v) => {
      const array = Array.from(v as any)
      return array.includes(value) || array.includes(unref(value))
    }, options)
  }

  function changed(options?: UntilToMatchOptions) {
    return changedTimes(1, options)
  }

  function changedTimes(n = 1, options?: UntilToMatchOptions) {
    let count = -1 // skip the immediate check
    return toMatch(() => {
      count += 1
      return count >= n
    }, options)
  }

  if (Array.isArray(unref(r))) {
    const instance: UntilArrayInstance<T> = {
      toMatch,
      toContains,
      changed,
      changedTimes,
      get not() {
        isNot = !isNot
        return this
      },
    }
    return instance
  }
  else {
    const instance: UntilValueInstance<T> = {
      toMatch,
      toBe,
      toBeTruthy,
      toBeNull,
      toBeNaN,
      toBeUndefined,
      changed,
      changedTimes,
      get not() {
        isNot = !isNot
        return this
      },
    }

    return instance
  }
}
