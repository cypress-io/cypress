/**
 * @vitest-environment node
 */
import chai from 'chai'
import { describe, it, expect } from 'vitest'
import { create } from '../../../../src/cy/chai/inspect'

const { inspect: inspectWithOptions } = create(chai)
const inspect = (value: unknown) => inspectWithOptions(value, false, 2, false)

describe('src/cy/chai/inspect', () => {
  describe('property names', () => {
    it.each([
      ['foo', '{ foo: 1 }'],
      ['_foo', '{ _foo: 1 }'],
      ['FooBar', '{ FooBar: 1 }'],
      ['mIxEd_Case_9', '{ mIxEd_Case_9: 1 }'],
    ])('leaves the identifier %s unquoted', (key, expected) => {
      expect(inspect({ [key]: 1 })).toBe(expected)
    })

    it.each([
      ['9lives', `{ '9lives': 1 }`],
      ['foo-bar', `{ 'foo-bar': 1 }`],
      ['foo bar', `{ 'foo bar': 1 }`],
      ['', `{ '': 1 }`],
      ['café', `{ 'café': 1 }`],
    ])('quotes the non-identifier %j', (key, expected) => {
      expect(inspect({ [key]: 1 })).toBe(expected)
    })
  })

  describe('typed arrays', () => {
    it.each([
      [new Uint8Array([1, 2]), '[ 1, 2 ]'],
      [new Float64Array([1.5]), '[ 1.5 ]'],
      [new Int16Array([]), '[]'],
    ])('formats %o as an array', (value, expected) => {
      expect(inspect(value)).toBe(expected)
    })

    it('formats any object whose tag ends in Array as a typed array', () => {
      expect(inspect({ [Symbol.toStringTag]: 'FooArray', length: 1, 0: 'a' })).toBe('[ a ]')
    })

    it('does not format an object whose tag only contains Array as a typed array', () => {
      expect(inspect({ [Symbol.toStringTag]: 'FooArrayLike', length: 1 })).toBe('{ length: 1 }')
    })

    it('does not format an ArrayBuffer as a typed array', () => {
      expect(inspect(new ArrayBuffer(2))).toBe('{}')
    })
  })
})
