const __cypressModuleCache = new Map()

const NO_DEFINE_LIST = new Set(['prototype'])

window.__cypressModule = function (module) {
  if (!__cypressModuleCache.has(module)) {
    // What we build our module proxy off of depends on whether the module has a default export
    // We need to be able to support `import DefaultValue from 'module'` => `const DefaultValue = __cypressModule(module)`
    const base = module.default || module
    let target

    // Work around for the fact that a module with a default export needs to work the same way via object destructuring
    // for this module remapping concept to work
    // ```
    // import TheDefault from 'module'
    // `TheDefault` could be an object or a function
    // ```
    if (typeof base === 'function') {
      target = function (...params) {
        if (typeof target.default === 'function') {
          return target.default.apply(this, params)
        }

        if (typeof module === 'function') {
          return module.apply(this, params)
        }
      }
    } else {
      target = {}
    }

    const proxies = {}

    if (module.default && typeof module.default !== 'function') {
      Object.entries(Object.getOwnPropertyDescriptors(module.default)).forEach(([key, descriptor]) => {
        if (NO_DEFINE_LIST.has(key)) {
          return
        }

        Object.defineProperty(target, key, {
          ...descriptor,
          writable: true,
          enumerable: true,
        })

        if (typeof descriptor.value === 'function') {
          proxies[key] = function (...params) {
            return target[key].apply(this, params)
          }
        }
      })
    }

    Object.entries(Object.getOwnPropertyDescriptors(module)).forEach(([key, descriptor]) => {
      if (NO_DEFINE_LIST.has(key)) {
        return
      }

      Object.defineProperty(target, key, {
        ...descriptor,
        configurable: true,
        writable: true,
      })

      if (typeof descriptor.value === 'function') {
        proxies[key] = function (...params) {
          return target[key].apply(this, params)
        }
      }
    })

    const moduleProxy = new Proxy(target, {
      get (_, prop, receiver) {
        const value = target[prop]

        if (typeof value === 'function') {
          const stack = new Error().stack

          if (stack.includes('Sandbox.spy')) {
            return value
          }

          return proxies[prop]
        }

        return target[prop]
      },
      set (obj, prop, value) {
        target[prop] = value

        if (typeof value === 'function' && !(prop in proxies)) {
          proxies[prop] = function (...params) {
            return target[prop].apply(this, params)
          }
        }

        return true
      },
      defineProperty (_, key, descriptor) {
        // Ignore `define` attempts to set a sinon proxy, but return true anyways
        // Allowing define would blow away our function proxy
        // Sinon circles back and attempts to set via `set` anyways so this isn't necessary
        if (descriptor.value?.isSinonProxy) {
          return true
        }

        Object.defineProperty(target, key, { ...descriptor, writable: true, configurable: true })

        return true
      },
      deleteProperty (_, prop) {
        // Don't allow deletion - Sinon tries to delete things as a cleanup activity which breaks our proxied functions

        return true
      },
    })

    __cypressModuleCache.set(module, moduleProxy)
  }

  return __cypressModuleCache.get(module)
}
