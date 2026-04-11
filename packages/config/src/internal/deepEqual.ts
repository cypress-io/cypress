const isPlainObject = (val: any): boolean => {
  if (val == null || typeof val !== 'object') return false

  const proto = Object.getPrototypeOf(val)

  return proto === Object.prototype || proto === null
}

export const deepEqual = (a: any, b: any, seen = new Map<any, Set<any>>()): boolean => {
  if (a === b) return true

  // NaN === NaN should be true (matching lodash _.isEqual)
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return true

  if (a == null || b == null) return false

  if (typeof a !== typeof b) return false

  if (typeof a === 'function') return a === b

  if (typeof a !== 'object') return false

  // pairwise cycle detection: only short-circuit for the same (a, b) pair
  const seenForA = seen.get(a)

  if (seenForA?.has(b)) return true

  if (!seenForA) seen.set(a, new Set([b]))
  else seenForA.add(b)

  // Date
  if (a instanceof Date) return b instanceof Date && a.getTime() === b.getTime()

  // RegExp
  if (a instanceof RegExp) return b instanceof RegExp && a.source === b.source && a.flags === b.flags

  // Map: deep-equal keys and values
  if (a instanceof Map) {
    if (!(b instanceof Map) || a.size !== b.size) return false

    for (const [aKey, aVal] of a) {
      let matched = false

      for (const [bKey, bVal] of b) {
        if (deepEqual(aKey, bKey, seen) && deepEqual(aVal, bVal, seen)) {
          matched = true
          break
        }
      }

      if (!matched) return false
    }

    return true
  }

  // Set: deep-equal elements with bookkeeping to avoid double-matching
  if (a instanceof Set) {
    if (!(b instanceof Set) || a.size !== b.size) return false

    const bUsed = new Set<any>()

    for (const aVal of a) {
      let matched = false

      for (const bVal of b) {
        if (!bUsed.has(bVal) && deepEqual(aVal, bVal, seen)) {
          bUsed.add(bVal)
          matched = true
          break
        }
      }

      if (!matched) return false
    }

    return true
  }

  // Arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false

    return a.every((val, i) => deepEqual(val, b[i], seen))
  }

  // Non-plain objects: compare by reference (class instances, URL, etc.)
  if (!isPlainObject(a) || !isPlainObject(b)) return false

  // Plain objects
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key], seen))
}

export const cloneDeepSafe = (obj: any, seen = new Map<any, any>()): any => {
  if (obj === null || typeof obj !== 'object') return obj

  if (typeof obj === 'function') return obj

  // cycle detection
  if (seen.has(obj)) return seen.get(obj)

  // Non-plain objects (Date, RegExp, Map, Set, URL, class instances): preserve by reference
  if (!isPlainObject(obj) && !Array.isArray(obj)) return obj

  if (Array.isArray(obj)) {
    const arr: any[] = []

    seen.set(obj, arr)
    for (const item of obj) {
      arr.push(cloneDeepSafe(item, seen))
    }

    return arr
  }

  // Plain objects: deep clone, preserving function values by reference
  const clone: Record<string, any> = {}

  seen.set(obj, clone)
  for (const key of Object.keys(obj)) {
    clone[key] = cloneDeepSafe(obj[key], seen)
  }

  return clone
}
