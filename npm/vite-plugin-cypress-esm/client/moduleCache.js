const __cypressModuleCache = new Map()

const NO_REDEFINE_LIST = new Set(['prototype'])

// This is how you can see if something is a class
// Playground: https://regex101.com/r/OS2Iyg/1
const classRe = /class.+?\{.+?\}/gms

function createProxyModule (module) {
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

  const redefinePropertyDescriptors = (module, overrides) => {
    Object.entries(Object.getOwnPropertyDescriptors(module)).forEach(([key, descriptor]) => {
      if (NO_REDEFINE_LIST.has(key)) {
        return
      }

      log(`🧪 Redefining ${key}`)

      Object.defineProperty(target, key, {
        ...descriptor,
        ...overrides,
      })

      if (typeof descriptor.value === 'function') {
        proxies[key] = function (...params) {
          const isClass = classRe.exec(target[key].toString())

          if (isClass) {
            // Edge case - use `apply` with `new` to create a class instance
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
            return Reflect.construct(target[key], params)
          }

          return target[key].apply(this, params)
        }
      }
    })
  }

  if (module.default && typeof module.default !== 'function') {
    redefinePropertyDescriptors(module.default, {
      writable: true,
      enumerable: true,
    })
  }

  redefinePropertyDescriptors(module, {
    configurable: true,
    writable: true,
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

  return moduleProxy
}

function log (msg) {
  console.log(`[cypress:vite-plugin-proxify-esm]: ${msg}`)
}

function cacheAndProxifyModule (id, module, debug) {
  if (__cypressModuleCache.has(module)) {
    return __cypressModuleCache.get(module)
  }

  if (debug) {
    log(`🔨 creating proxy module for ${id}`)
  }

  const moduleProxy = createProxyModule(module)

  if (debug) {
    log(`✅ created proxy module for ${id}`)
  }

  __cypressModuleCache.set(module, moduleProxy)

  return moduleProxy
}

window.__cypressDynamicModule = function (id, importPromise, debug = false) {
  return Promise.resolve(importPromise.then((module) => {
    return cacheAndProxifyModule(id, module, debug)
  }))
}

window.__cypressModule = function (id, module, debug = false) {
  return cacheAndProxifyModule(id, module, debug)
}
