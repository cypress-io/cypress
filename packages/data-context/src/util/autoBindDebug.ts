import debugLib from 'debug'

const debugLibCache: Record<string, debugLib.Debugger> = {}

/**
 * This function enables trace logging on all function calls and setters for a given class.
 * If you add:
 *
 * return autoBindDebug(this)
 *
 * to the constructor of the class for which you want to enable logging, you can then
 * set DEBUG=cypress-trace:<ClassName> to utilize the logging
 */
export function autoBindDebug <T extends object> (obj: T): T {
  const ns = `trace-cypress:${obj.constructor.name}`
  const debug = debugLibCache[ns] = debugLibCache[ns] || debugLib(ns)

  if (!debug.enabled) {
    return obj
  }

  for (const [k, v] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(obj)))) {
    if (v.writable && typeof v.value === 'function') {
      const original = v.value

      // @ts-ignore
      obj[k] = function () {
        debug(`calling %s with args %o`, k, arguments)

        return original.apply(this, arguments)
      }
    }
  }

  return new Proxy(obj, {
    set (target, p, value, receiver) {
      debug(`set ${p.toString()} to %o`, value)

      return Reflect.set(target, p, value, receiver)
    },
  })
}
