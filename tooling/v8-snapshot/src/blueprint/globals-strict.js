//
// <globals-strict>
//

// The below is only included when verifying the snapshot.
// When generating a snapshot to feed to mksnapshot they cannot
// be included as then they'd modify the environment when running the
// snapshotted application.
// These are included in addition to the commmon globals, see: ./globals.js
//
// NOTE: that the errors it throws for particular issues are designed to be
// parsed by the snapshot doctor such that it can handle it by deferring
// the module.

function cannotAccess (proto, prop) {
  return function () {
    throw `[SNAPSHOT_CACHE_FAILURE] Cannot access ${proto}.${prop} during snapshot creation`
  }
}
function cannotDefine (proto, prop) {
  throw `[SNAPSHOT_CACHE_FAILURE] Cannot define ${proto}.${prop} during snapshot creation`
}

function cannotDelete (proto, prop) {
  throw `[SNAPSHOT_CACHE_FAILURE] Cannot delete ${proto}.${prop} during snapshot creation`
}

function getsetPrevent (proto, prop) {
  return {
    get: cannotAccess(proto, `${prop} getter`),
    set: cannotAccess(proto, `${prop} setter`),
  }
}

function proxyPrevent (item, { construction, get, set, apply, define, del }) {
  const key = item.prototype.constructor.name
  const proxyHandler = {}

  if (construction) {
    proxyHandler.construct = cannotAccess(key, 'constructor')
  }

  if (get) {
    proxyHandler.get = function (_target, prop, _receiver) {
      cannotAccess(key, prop)()
    }
  }

  if (set) {
    proxyHandler.set = function (_tarset, prop, _value) {
      cannotAccess(key, prop)()
    }
  }

  if (apply) {
    proxyHandler.apply = function (target, _thisArg, _args) {
      cannotAccess(key, target.name)()
    }
  }

  if (define) {
    proxyHandler.defineProperty = function (_target, prop, _descriptor) {
      cannotDefine(key, prop)
    }
  }

  if (del) {
    proxyHandler.deleteProperty = function (_target, prop) {
      cannotDelete(key, prop)()
    }
  }

  return new Proxy(item, proxyHandler)
}

//
// Error
//
Object.defineProperties(Error, {
  captureStackTrace: { value: cannotAccess('Error', 'captureStackTrace') },
  stackTraceLimit: getsetPrevent('Error', 'stackTraceLimit'),
  prepareStackTrace: getsetPrevent('Error', 'prepareStackTrace'),
  name: getsetPrevent('Error', 'name'),
})

//
// Promise
//
proxyPrevent(Promise, {
  construction: true,
  get: true,
  set: true,
  apply: true,
  define: true,
  del: true,
})

//
// Arrays
//

const arrayPreventors = { construction: true }

Uint8Array = proxyPrevent(Uint8Array, arrayPreventors)
Uint16Array = proxyPrevent(Uint16Array, arrayPreventors)
Uint32Array = proxyPrevent(Uint32Array, arrayPreventors)
Uint8ClampedArray = proxyPrevent(Uint8ClampedArray, arrayPreventors)
Int8Array = proxyPrevent(Int8Array, arrayPreventors)
Int16Array = proxyPrevent(Int16Array, arrayPreventors)
Int32Array = proxyPrevent(Int32Array, arrayPreventors)
Array = proxyPrevent(Array, arrayPreventors)

//
// </globals-strict>
//
