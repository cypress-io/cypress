const __cypressModuleCache = new Map()

const NO_REDEFINE_LIST = new Set(['prototype'])

let debug = false

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

  function redefinePropertyDescriptors (module, overrides) {
    Object.entries(Object.getOwnPropertyDescriptors(module)).forEach(([key, descriptor]) => {
      if (Array.isArray(module)) {
        return
      }

      if (NO_REDEFINE_LIST.has(key)) {
        log(`⏭️ Skipping ${key}`)

        return
      }

      log(`🧪 Redefining ${key}`)

      const params = {
        ...descriptor,
        ...overrides,
      }

      // If a property defines accessors it cannot also specify `value` and/or `writable`.
      // Those are implicit from the presence of the accessor functions.
      if ('get' in params || 'set' in params) {
        delete params.writable
        delete params.value
      }

      Object.defineProperty(target, key, params)

      // The underlying value could be a raw value *or* a value provided by a getter
      const describedValue = descriptor.value || descriptor.get?.()

      if (typeof describedValue === 'function') {
        // This is how you can see if something is a class
        // TODO: Revisit, there has to be a better way to do this
        // Important! RegEx instances are stateful, do not extract to a constant
        const isClass = /^class\s.+?\{.+?\}/gms.test(describedValue.toString())

        if (isClass) {
          log(`🏗️ Handling ${key} as a constructor`)

          proxies[key] = function (...params) {
            // Edge case - use `apply` with `new` to create a class instance
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
            return Reflect.construct(target[key], params)
          }
        } else {
          log(`🎁 Handling ${key} with a standard wrapper function`)

          proxies[key] = function (...params) {
            // Prefer invoking with `apply` so we get proper context in the invoked function
            if (target[key].apply) {
              return target[key].apply(this, params)
            }

            // Certain weird edge-cases manage to create functions without the Function
            // prototype, thus no `apply` 🤷. Fall back to straight invocation
            return target[key](params)
          }
        }

        proxies[key].prototype = target[key].prototype
      } else {
        log(`${key} is not a function`)
      }
    })
  }

  // Do not proxify arrays - you can't spy on an array, no need.
  if (Array.isArray(module.default)) {
    return module.default
  }

  if (module.default) {
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
        // Check to see if this retrieval is coming from a sinon `spy` creation
        // If so, we want to supply the 'true' function rather than our proxied version
        // so the spy can call through to the real implementation
        const stack = new Error().stack

        if (stack?.includes('Sandbox.spy')) {
          log(`🕵️ Detected ${prop} is being defined as a Sinon spy`)

          return value
        }

        // Otherwise, return our proxied function implementation
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
  if (!debug) {
    return
  }

  console.log(`[cypress:vite-plugin-cypress-esm]: ${msg}`)
}

function cacheAndProxifyModule (id, module) {
  if (__cypressModuleCache.has(module)) {
    return __cypressModuleCache.get(module)
  }

  log(`🔨 creating proxy module for ${id}`)

  try {
    const moduleProxy = createProxyModule(module)

    log(`✅ created proxy module for ${id}`)

    __cypressModuleCache.set(module, moduleProxy)

    log(`📈 Module cache now contains ${__cypressModuleCache.size} entries`)

    return moduleProxy
  } catch (err) {
    console.warn(`Failed to proxy module ${id}, using original which will *not* support stub/spy`, err)

    return module
  }
}

window.__cypressDynamicModule = function (id, importPromise, _debug = false) {
  debug = _debug

  return Promise.resolve(importPromise.then((module) => {
    return cacheAndProxifyModule(id, module)
  }))
}

window.__cypressModule = function (id, module, _debug = false) {
  debug = _debug

  return cacheAndProxifyModule(id, module)
}
