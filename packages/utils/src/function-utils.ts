export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  flush(): ReturnType<T> | void
  cancel(): void
}

export function debounce<T extends (...args: any[]) => any> (fn: T, wait: number): DebouncedFunction<T> {
  let timerId: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  let lastThis: any
  let lastResult: ReturnType<T> | void

  function invoke (): ReturnType<T> | void {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = undefined
    lastThis = undefined
    lastResult = fn.apply(thisArg, args)

    return lastResult
  }

  const debounced = function (this: any, ...args: Parameters<T>): void {
    lastArgs = args
    lastThis = this

    if (timerId !== undefined) clearTimeout(timerId)

    timerId = setTimeout(() => {
      timerId = undefined
      invoke()
    }, wait)
  } as DebouncedFunction<T>

  debounced.flush = function (): ReturnType<T> | void {
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timerId = undefined

      return invoke()
    }

    return lastResult
  }

  debounced.cancel = function (): void {
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timerId = undefined
    }

    lastArgs = undefined
    lastThis = undefined
  }

  return debounced
}

export function once<T extends (...args: any[]) => any> (fn: T): T {
  let called = false
  let result: ReturnType<T>

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true
      result = fn.apply(this, args)
    }

    return result
  } as unknown as T
}

let idCounter = 0

export function uniqueId (prefix = ''): string {
  return `${prefix}${++idCounter}`
}
