const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor'])

/**
 * Parse a path into an array of string/number segments.
 *
 * Supports dotted paths (`a.b.c`), numeric indices (`0`),
 * and simple bracket numeric segments (`a[0].b`).
 *
 * This is a Cypress-scoped path parser. It does NOT support
 * quoted bracket keys like `a["b"]` or escaped-dot keys.
 */
export function toPathArray (path: string | number | (string | number)[]): (string | number)[] {
  if (Array.isArray(path)) return [...path]

  if (typeof path === 'number') return [path]

  const result: (string | number)[] = []
  let current = ''
  let i = 0

  while (i < path.length) {
    if (path[i] === '.') {
      if (current) result.push(current)

      current = ''
      i++
    } else if (path[i] === '[') {
      if (current) result.push(current)

      current = ''
      i++
      let bracket = ''

      while (i < path.length && path[i] !== ']') {
        bracket += path[i]
        i++
      }

      i++ // skip ]
      const num = Number(bracket)

      result.push(Number.isFinite(num) && bracket !== '' ? num : bracket)
    } else {
      current += path[i]
      i++
    }
  }

  if (current) result.push(current)

  return result
}

export function getPath (obj: any, path: string | number | (string | number)[]): any {
  const parts = toPathArray(path)
  let current = obj

  for (const part of parts) {
    if (current == null) return undefined

    const key = String(part)

    if (FORBIDDEN.has(key)) return undefined

    current = current[part]
  }

  return current
}

export function setPath (obj: any, path: string | number | (string | number)[], value: any): any {
  const parts = toPathArray(path)

  if (!parts.length) return obj

  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const key = String(parts[i])

    if (FORBIDDEN.has(key)) return obj

    if (current[parts[i]] == null) {
      const nextKey = parts[i + 1]

      current[parts[i]] = typeof nextKey === 'number' ? [] : {}
    }

    current = current[parts[i]]
  }

  const lastKey = String(parts[parts.length - 1])

  if (FORBIDDEN.has(lastKey)) return obj

  current[parts[parts.length - 1]] = value

  return obj
}

export function hasPath (obj: any, path: string | number | (string | number)[]): boolean {
  const parts = toPathArray(path)
  let current = obj

  for (let i = 0; i < parts.length; i++) {
    if (current == null) return false

    const key = String(parts[i])

    if (FORBIDDEN.has(key)) return false

    if (!Object.prototype.hasOwnProperty.call(current, parts[i])) return false

    current = current[parts[i]]
  }

  return true
}

export function defaults<T extends Record<string, any>> (target: T, ...sources: (Record<string, any> | null | undefined)[]): T {
  for (const source of sources) {
    if (source == null) continue

    for (const key of Object.keys(source)) {
      if (target[key] === undefined) {
        (target as any)[key] = source[key]
      }
    }
  }

  return target
}

export function pick (obj: Record<string, any> | null | undefined, ...keys: (string | string[])[]): Record<string, any> {
  if (obj == null || typeof obj !== 'object') return {}

  const allKeys = keys.flat()
  const result: Record<string, any> = {}

  for (const key of allKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key]
    }
  }

  return result
}

export function omit (obj: Record<string, any> | null | undefined, ...keys: (string | string[])[]): Record<string, any> {
  if (obj == null) return {}

  const keySet = new Set(keys.flat())
  const result: Record<string, any> = {}

  for (const key of Object.keys(obj)) {
    if (!keySet.has(key)) {
      result[key] = obj[key]
    }
  }

  return result
}

export function omitBy<T extends Record<string, any>> (obj: T, predicate: (value: any, key: string) => boolean): Partial<T> {
  const result: Record<string, any> = {}

  for (const key of Object.keys(obj)) {
    if (!predicate(obj[key], key)) {
      result[key] = obj[key]
    }
  }

  return result as Partial<T>
}

export function mapValues<T extends Record<string, any>, U> (obj: T, fn: (value: T[keyof T], key: string) => U): Record<string, U> {
  const result: Record<string, U> = {}

  for (const key of Object.keys(obj)) {
    result[key] = fn(obj[key], key)
  }

  return result
}
