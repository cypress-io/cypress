import debugLib from 'debug'

const debugLibCache: Record<string, debugLib.Debugger> = {}

export function autoBindDebug <T extends object> (obj: T): T {
  const ns = `cypress-trace:${obj.constructor.name}`
  const debug = debugLibCache[ns] = debugLibCache[ns] || debugLib(ns)

  if (!debug.enabled) {
    return obj
  }

  return new Proxy(obj, {
    set (target, p, value, receiver) {
      debug(`set ${p.toString()} to %o`, value)

      return Reflect.set(target, p, value, receiver)
    },
    get (target, p, receiver) {
      const val = Reflect.get(target, p, receiver)

      if (typeof val === 'function') {
        return new Proxy(val, {
          apply (target, thisArg, argArray) {
            debug(`calling ${p.toString()} with args %o`, argArray)

            return Reflect.apply(target, thisArg, argArray)
          },
        })
      }

      return val
    },
  })
}
