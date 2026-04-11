import { describe, it, expect } from 'vitest'
import {
  defaults,
  pick,
  omit,
  omitBy,
  mapValues,
  getPath,
  setPath,
  hasPath,
  toPathArray,
} from '../src/object-utils'

describe('toPathArray', () => {
  it('returns a copy for array inputs', () => {
    const input = ['a', 'b']
    const result = toPathArray(input)

    expect(result).toEqual(['a', 'b'])
    expect(result).not.toBe(input)
  })

  it('wraps number in array', () => {
    expect(toPathArray(0)).toEqual([0])
  })

  it('splits dotted string paths', () => {
    expect(toPathArray('a.b.c')).toEqual(['a', 'b', 'c'])
  })

  it('handles bracket numeric segments', () => {
    expect(toPathArray('a[0].b')).toEqual(['a', 0, 'b'])
  })

  it('handles consecutive brackets', () => {
    expect(toPathArray('a[0][1]')).toEqual(['a', 0, 1])
  })

  it('handles single key', () => {
    expect(toPathArray('a')).toEqual(['a'])
  })

  it('handles empty string', () => {
    expect(toPathArray('')).toEqual([])
  })

  it('handles non-numeric bracket content as string', () => {
    expect(toPathArray('a[foo]')).toEqual(['a', 'foo'])
  })
})

describe('getPath', () => {
  it('gets nested values', () => {
    expect(getPath({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42)
  })

  it('gets array elements', () => {
    expect(getPath({ a: [10, 20, 30] }, 'a[1]')).toBe(20)
  })

  it('returns undefined for missing paths', () => {
    expect(getPath({ a: 1 }, 'b.c')).toBeUndefined()
  })

  it('returns undefined for null intermediate', () => {
    expect(getPath({ a: null }, 'a.b')).toBeUndefined()
  })

  it('blocks __proto__ access', () => {
    expect(getPath({}, '__proto__')).toBeUndefined()
  })

  it('blocks prototype access', () => {
    expect(getPath({}, 'prototype')).toBeUndefined()
  })

  it('blocks constructor access', () => {
    expect(getPath({}, 'constructor')).toBeUndefined()
  })

  it('accepts array path', () => {
    expect(getPath({ a: { b: 1 } }, ['a', 'b'])).toBe(1)
  })

  it('accepts numeric path', () => {
    expect(getPath([10, 20], 0)).toBe(10)
  })
})

describe('setPath', () => {
  it('sets nested values', () => {
    const obj = { a: { b: {} } } as any

    setPath(obj, 'a.b.c', 42)
    expect(obj.a.b.c).toBe(42)
  })

  it('creates intermediate objects', () => {
    const obj = {} as any

    setPath(obj, 'a.b.c', 1)
    expect(obj.a.b.c).toBe(1)
  })

  it('creates intermediate arrays for numeric keys', () => {
    const obj = {} as any

    setPath(obj, 'a[0]', 'x')
    expect(Array.isArray(obj.a)).toBe(true)
    expect(obj.a[0]).toBe('x')
  })

  it('returns the original object', () => {
    const obj = {}
    const result = setPath(obj, 'a', 1)

    expect(result).toBe(obj)
  })

  it('blocks __proto__ set', () => {
    const obj = {} as any

    setPath(obj, '__proto__.polluted', true)
    expect(({} as any).polluted).toBeUndefined()
  })

  it('blocks prototype in path', () => {
    const obj = { a: {} } as any

    setPath(obj, 'a.prototype.x', 1)
    expect(obj.a.prototype).toBeUndefined()
  })

  it('blocks constructor in path', () => {
    const obj = {} as any

    setPath(obj, 'constructor.x', 1)
    expect(obj.constructor.x).toBeUndefined()
  })
})

describe('hasPath', () => {
  it('returns true for existing paths', () => {
    expect(hasPath({ a: { b: 1 } }, 'a.b')).toBe(true)
  })

  it('returns true for falsy values', () => {
    expect(hasPath({ a: 0 }, 'a')).toBe(true)
    expect(hasPath({ a: null }, 'a')).toBe(true)
    expect(hasPath({ a: false }, 'a')).toBe(true)
    expect(hasPath({ a: '' }, 'a')).toBe(true)
  })

  it('returns false for missing paths', () => {
    expect(hasPath({ a: 1 }, 'b')).toBe(false)
  })

  it('returns false for missing nested paths', () => {
    expect(hasPath({ a: {} }, 'a.b.c')).toBe(false)
  })

  it('returns false for null intermediate', () => {
    expect(hasPath({ a: null }, 'a.b')).toBe(false)
  })

  it('blocks __proto__', () => {
    expect(hasPath({}, '__proto__')).toBe(false)
  })

  it('accepts array path', () => {
    expect(hasPath({ a: { b: 1 } }, ['a', 'b'])).toBe(true)
  })

  it('returns false for inherited properties', () => {
    const obj = Object.create({ inherited: true })

    expect(hasPath(obj, 'inherited')).toBe(false)
  })
})

describe('defaults', () => {
  it('fills in undefined keys', () => {
    const result = defaults({ a: 1 }, { a: 2, b: 3 })

    expect(result).toEqual({ a: 1, b: 3 })
  })

  it('preserves null', () => {
    const result = defaults({ a: null } as any, { a: 1 })

    expect(result.a).toBeNull()
  })

  it('preserves false', () => {
    const result = defaults({ a: false } as any, { a: true })

    expect(result.a).toBe(false)
  })

  it('preserves 0', () => {
    const result = defaults({ a: 0 } as any, { a: 1 })

    expect(result.a).toBe(0)
  })

  it('preserves empty string', () => {
    const result = defaults({ a: '' } as any, { a: 'default' })

    expect(result.a).toBe('')
  })

  it('accepts multiple sources (first wins)', () => {
    const result = defaults({} as any, { a: 1 }, { a: 2, b: 3 })

    expect(result).toEqual({ a: 1, b: 3 })
  })

  it('mutates the target', () => {
    const target = {} as any

    defaults(target, { a: 1 })
    expect(target.a).toBe(1)
  })

  it('skips null sources', () => {
    const result = defaults({} as any, null, { a: 1 })

    expect(result).toEqual({ a: 1 })
  })

  it('skips undefined sources', () => {
    const result = defaults({} as any, undefined, { a: 1 })

    expect(result).toEqual({ a: 1 })
  })
})

describe('pick', () => {
  it('picks specified keys from array', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('picks variadic string keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, 'a', 'c')).toEqual({ a: 1, c: 3 })
  })

  it('ignores missing keys', () => {
    expect(pick({ a: 1 }, ['a', 'b'])).toEqual({ a: 1 })
  })

  it('returns empty for empty keys', () => {
    expect(pick({ a: 1 })).toEqual({})
  })

  it('only picks own properties', () => {
    const obj = Object.create({ inherited: true })

    obj.own = 1
    expect(pick(obj, 'own', 'inherited')).toEqual({ own: 1 })
  })
})

describe('omit', () => {
  it('omits specified keys from array', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 })
  })

  it('omits variadic string keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, 'b', 'c')).toEqual({ a: 1 })
  })

  it('returns copy with no keys omitted', () => {
    const result = omit({ a: 1 })

    expect(result).toEqual({ a: 1 })
  })
})

describe('omitBy', () => {
  it('omits entries matching predicate', () => {
    const result = omitBy({ a: 1, b: null, c: 3 }, (v) => v == null)

    expect(result).toEqual({ a: 1, c: 3 })
  })

  it('passes key as second argument', () => {
    const result = omitBy({ keep: 1, _skip: 2 }, (_v, k) => k.startsWith('_'))

    expect(result).toEqual({ keep: 1 })
  })
})

describe('mapValues', () => {
  it('maps values of object', () => {
    expect(mapValues({ a: 1, b: 2 }, (v) => v * 2)).toEqual({ a: 2, b: 4 })
  })

  it('passes key as second argument', () => {
    expect(mapValues({ x: 1 }, (_v, k) => k)).toEqual({ x: 'x' })
  })
})
