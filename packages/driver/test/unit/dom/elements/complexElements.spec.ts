import { afterEach, describe, expect, it } from 'vitest'

import { canSetSelectionRangeElement } from '../../../../src/dom/elements/complexElements'

describe('dom/elements/complexElements', () => {
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
    ])('returns true for input[type=%s]', (type, value) => {
      expect(canSetSelectionRangeElement(createInput(type, value))).toBe(true)
    })

    it.each([
      ['email', 'jane.doe@example.com'],
      ['number', '42'],
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
})
