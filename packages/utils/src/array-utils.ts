type Iteratee<T, R> = ((item: T) => R) | keyof T

function resolveIteratee<T> (iteratee: Iteratee<T, any>): (item: T) => any {
  if (typeof iteratee === 'function') return iteratee as (item: T) => any

  return (item: T) => (item as any)[iteratee]
}

export function sortBy<T> (arr: T[], iteratee: Iteratee<T, any>): T[] {
  const fn = resolveIteratee(iteratee)

  return [...arr].sort((a, b) => {
    const va = fn(a)
    const vb = fn(b)

    if (va < vb) return -1
    if (va > vb) return 1

    return 0
  })
}

export function groupBy<T> (arr: T[], iteratee: Iteratee<T, string | number>): Record<string, T[]> {
  const fn = resolveIteratee(iteratee)
  const result: Record<string, T[]> = {}

  for (const item of arr) {
    const key = String(fn(item))

    if (!result[key]) result[key] = []

    result[key].push(item)
  }

  return result
}

export function uniqBy<T> (arr: T[], iteratee: Iteratee<T, any>): T[] {
  const fn = resolveIteratee(iteratee)
  const seen = new Set()
  const result: T[] = []

  for (const item of arr) {
    const key = fn(item)

    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }

  return result
}

export function difference<T> (arr: T[], ...others: T[][]): T[] {
  const excluded = new Set(others.flat())

  return arr.filter((item) => !excluded.has(item))
}

export function intersection<T> (...arrays: T[][]): T[] {
  if (!arrays.length) return []

  const [first, ...rest] = arrays
  const result: T[] = []
  const seen = new Set<T>()

  for (const item of first) {
    if (seen.has(item)) continue

    if (rest.every((arr) => arr.includes(item))) {
      seen.add(item)
      result.push(item)
    }
  }

  return result
}

export function without<T> (arr: T[], ...values: T[]): T[] {
  const excluded = new Set(values)

  return arr.filter((item) => !excluded.has(item))
}

export function partition<T> (arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = []
  const fail: T[] = []

  for (const item of arr) {
    if (predicate(item)) {
      pass.push(item)
    } else {
      fail.push(item)
    }
  }

  return [pass, fail]
}
