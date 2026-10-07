import { describe, expect, it, vi } from 'vitest'

import { defaultNormalizer, describeMatcher, identityNormalizer, isValidMatcher, matches } from '../../../../src/dom/accessibility/matchers'

describe('dom/accessibility/matchers', () => {
  describe('defaultNormalizer', () => {
    it('trims and collapses whitespace', () => {
      expect(defaultNormalizer('  Save \n\t changes  ')).toBe('Save changes')
    })
  })

  describe('matches', () => {
    const element = document.createElement('div')

    it('never matches text that is not a string', () => {
      expect(matches(null, element, 'a')).toBe(false)
      expect(matches(undefined, element, () => true)).toBe(false)
    })

    it('matches a string against the whole normalized text', () => {
      expect(matches('  Save  changes ', element, 'Save changes')).toBe(true)
      expect(matches('Save changes', element, 'Save')).toBe(false)
      expect(matches('Save changes', element, 'save changes')).toBe(false)
    })

    it('matches a string case-insensitively against any part of the text when exact is false', () => {
      expect(matches('Save changes', element, 'SAVE', { exact: false })).toBe(true)
      expect(matches('Save changes', element, 'cancel', { exact: false })).toBe(false)
    })

    it('matches a number as a string', () => {
      expect(matches('42', element, 42)).toBe(true)
    })

    it('tests a regular expression against the normalized text', () => {
      expect(matches('  Save   changes', element, /^Save changes$/)).toBe(true)
      expect(matches('Save changes', element, /cancel/)).toBe(false)
    })

    it('gives the same answer every time for a global regular expression', () => {
      const matcher = /save/gi

      expect(matches('Save', element, matcher)).toBe(true)
      expect(matches('Save', element, matcher)).toBe(true)
    })

    it('calls a function with the normalized text and the element', () => {
      const matcher = vi.fn((content: string) => content === 'Save changes')

      expect(matches(' Save  changes ', element, matcher)).toBe(true)
      expect(matcher).toHaveBeenCalledWith('Save changes', element)
    })

    it('uses the normalizer it is given', () => {
      expect(matches(' Save ', element, ' Save ', { normalizer: identityNormalizer })).toBe(true)
      expect(matches(' Save ', element, 'Save', { normalizer: identityNormalizer })).toBe(false)
    })
  })

  describe('isValidMatcher', () => {
    it('accepts strings, numbers, regular expressions and functions', () => {
      expect(isValidMatcher('a')).toBe(true)
      expect(isValidMatcher(1)).toBe(true)
      expect(isValidMatcher(/a/)).toBe(true)
      expect(isValidMatcher(() => true)).toBe(true)
    })

    it('rejects anything else', () => {
      expect(isValidMatcher(undefined)).toBe(false)
      expect(isValidMatcher(null)).toBe(false)
      expect(isValidMatcher({})).toBe(false)
      expect(isValidMatcher(NaN)).toBe(false)
    })
  })

  describe('describeMatcher', () => {
    it('quotes strings and shows regular expressions and functions', () => {
      expect(describeMatcher('Save')).toBe('"Save"')
      expect(describeMatcher(/save/i)).toBe('/save/i')
      expect(describeMatcher(function isSave () {
        return true
      })).toBe('a function (isSave)')
    })
  })
})
