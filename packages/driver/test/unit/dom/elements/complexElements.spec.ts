import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import _ from '../../../../src/config/lodash'
import { canSetSelectionRangeElement, getFirstFixedOrStickyPositionParent } from '../../../../src/dom/elements/complexElements'

describe('dom/elements/complexElements', () => {
  // jQuery's patched `matchesSelector` calls the `_` global, which Cypress sets in the browser
  beforeAll(() => {
    vi.stubGlobal('_', _)
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  describe('canSetSelectionRangeElement', () => {
    afterEach(() => {
      document.body.innerHTML = ''
    })

    const createInput = (type: string, value: string) => {
      const input = document.createElement('input')

      input.setAttribute('type', type)
      input.value = value
      document.body.appendChild(input)

      return input
    }

    it.each([
      ['text', 'Jane Doe'],
      ['search', 'wireless headphones'],
      ['url', 'https://www.example.com/profile/jane-doe'],
      ['tel', '+1 555 010 0199'],
      ['password', 'c0rrect-h0rse-battery'],
      // the type property is lowercase whatever the attribute's case
      ['TEXT', 'Jane Doe'],
      ['URL', 'https://www.example.com/profile/jane-doe'],
    ])('returns true for input[type=%s]', (type, value) => {
      expect(canSetSelectionRangeElement(createInput(type, value))).toBe(true)
    })

    it.each([
      ['email', 'jane.doe@example.com'],
      ['number', '42'],
      ['date', '2024-01-02'],
      ['checkbox', 'on'],
    ])('returns false for input[type=%s]', (type, value) => {
      expect(canSetSelectionRangeElement(createInput(type, value))).toBe(false)
    })

    it('returns true for textarea', () => {
      const textarea = document.createElement('textarea')

      textarea.value = 'Shipping notes for Jane Doe'
      document.body.appendChild(textarea)

      expect(canSetSelectionRangeElement(textarea)).toBe(true)
    })

    it('returns false for non-input elements', () => {
      const div = document.createElement('div')

      document.body.appendChild(div)

      expect(canSetSelectionRangeElement(div)).toBe(false)
    })
  })

  describe('getFirstFixedOrStickyPositionParent', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="outer"><div id="parent"><span id="child"></span></div></div>'
    })

    const setPosition = (id: string, position: string) => {
      document.getElementById(id)!.style.position = position
    }

    const getParentId = () => getFirstFixedOrStickyPositionParent(document.getElementById('child'))?.attr('id')

    it.each(['fixed', 'sticky', '-webkit-sticky'])('finds an ancestor with position %s', (position) => {
      setPosition('parent', position)

      expect(getParentId()).toBe('parent')
    })

    it('returns the element itself when it is fixed', () => {
      setPosition('child', 'fixed')

      expect(getParentId()).toBe('child')
    })

    it('finds the closest of several fixed or sticky ancestors', () => {
      setPosition('outer', 'fixed')
      setPosition('parent', 'sticky')

      expect(getParentId()).toBe('parent')
    })

    it.each(['absolute', 'relative', 'static'])('ignores an ancestor with position %s', (position) => {
      setPosition('parent', position)

      expect(getParentId()).toBeUndefined()
    })
  })
})
