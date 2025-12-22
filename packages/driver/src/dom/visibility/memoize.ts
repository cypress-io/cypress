export function memoize<T> (fn: (...args: any[]) => T): (...args: any[]) => T {
  const objIds = new WeakMap<any, number>()
  let nextObjId = 0
  const cache = new WeakMap<any, { result: T, timestamp: number }>()

  function composeKey (...args: any[]): { key } {
    return {
      key: args.map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          return `${typeof arg}:${arg}`
        }

        if (['number', 'string', 'boolean'].includes(typeof arg)) {
          return `${typeof arg}:${String(arg)}`
        }

        if (!objIds.has(arg)) {
          objIds.set(arg, nextObjId)
          nextObjId++
        }

        return `obj:${objIds.get(arg)}`
      }).join('|'),
    }
  }

  return (...args: any[]) => {
    const key = composeKey(args)

    const cached = cache.get(key)

    if (cached && cached.timestamp > Date.now() - 100) {
      return cached.result
    }

    const result = fn(...args)

    cache.set(key, { result, timestamp: Date.now() })

    return result
  }
}
