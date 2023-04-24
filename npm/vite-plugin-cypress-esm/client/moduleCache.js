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

      Object.defineProperty(target, key, {
        ...descriptor,
        ...overrides,
      })

      if (typeof descriptor.value === 'function') {
        // This is how you can see if something is a class
        // Playground: https://regex101.com/r/OS2Iyg/1
        // Important! RegEx instances are stateful, do not extract to a constant
        const isClass = /class.+?\{.+?\}/gms.test(descriptor.value.toString())

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
            return target[key].apply(this, params)
          }
        }

        proxies[key].prototype = target[key].prototype
      }
    })
  }

  // Do not proxify arrays - you can't spy on an array, no need.
  if (Array.isArray(module.default)) {
    return module.default
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

  console.log(`[cypress:vite-plugin-mock-esm]: ${msg}`)
}

function cacheAndProxifyModule (id, module) {
  if (__cypressModuleCache.has(module)) {
    return __cypressModuleCache.get(module)
  }

  log(`🔨 creating proxy module for ${id}`)

  const moduleProxy = createProxyModule(module)

  log(`✅ created proxy module for ${id}`)

  __cypressModuleCache.set(module, moduleProxy)

  log(`📈 Module cache now contains ${__cypressModuleCache.size} entries`)

  return moduleProxy
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
