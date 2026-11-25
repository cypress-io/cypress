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
      ['firstName', '{ firstName: 1 }'],
      ['_internalId', '{ _internalId: 1 }'],
      ['UserProfile', '{ UserProfile: 1 }'],
      ['shippingAddress_Line2', '{ shippingAddress_Line2: 1 }'],
    ])('leaves the identifier %s unquoted', (key, expected) => {
      expect(inspect({ [key]: 1 })).toBe(expected)
    })

    it.each([
      ['2faEnabled', `{ '2faEnabled': 1 }`],
      ['content-type', `{ 'content-type': 1 }`],
      ['first name', `{ 'first name': 1 }`],
      ['$el', `{ '$el': 1 }`],
      ['', `{ '': 1 }`],
      ['prénom', `{ 'prénom': 1 }`],
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
      expect(inspect({ [Symbol.toStringTag]: 'PixelArray', length: 1, 0: 255 })).toBe('[ 255 ]')
    })

    it('does not format an object whose tag only contains Array as a typed array', () => {
      expect(inspect({ [Symbol.toStringTag]: 'PixelArrayLike', length: 1 })).toBe('{ length: 1 }')
    })

    it('does not format an ArrayBuffer as a typed array', () => {
      expect(inspect(new ArrayBuffer(2))).toBe('{}')
    })
  })
})
