import { describe, it, expect } from 'vitest'
import { isSupportedKey, toSupportedKey, NamedKeys } from '../src/automation'

describe('automation', () => {
  const supportedKeys = [...NamedKeys, 'a', 'b', 'c', 'd']
  const unsupportedKeys = [10, 'some random string', -1, null, undefined, true, false, Symbol('some symbol'), new Date(), new Error(), new Function(), new RegExp(/./), new Set(), new Map(), new WeakMap(), new WeakSet()]

  describe('toSupportedKey', () => {
    describe('supported keys', () => {
      for (const key of supportedKeys) {
        it(`returns ${key} for ${key}`, () => {
          expect(toSupportedKey(key)).toBe(key)
        })
      }

      it('returns a string for a single digit number', () => {
        expect(toSupportedKey(2)).toBe('2')
      })
    })

    describe('unsupported keys', () => {
      for (const key of unsupportedKeys) {
        it(`throws an error for ${String(key)}`, () => {
          // @ts-expect-error key is not a string
          expect(() => toSupportedKey(key)).toThrow()
        })
      }
    })
  })

  describe('isSupportedKey', () => {
    it('should return true for supported keys', () => {
      supportedKeys.forEach((key) => {
        expect(isSupportedKey(key)).toBe(true)
      })
    })

    it('returns false for unsupported keys', () => {
      unsupportedKeys.forEach((key) => {
        // @ts-expect-error key is not a string
        expect(isSupportedKey(key)).toBe(false)
      })
    })
  })
})
