/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import { isNeedSingleValueChangeInputElement } from '../../../../src/dom/elements/elementHelpers'

const createInput = (type: string) => {
  const input = document.createElement('input')

  input.setAttribute('type', type)

  return input
}

describe('dom/elements/elementHelpers', () => {
  describe('isNeedSingleValueChangeInputElement', () => {
    it.each(['date', 'time', 'week', 'month', 'datetime-local', 'DATE', 'Datetime-Local'])('is true for an input of type %s', (type) => {
      expect(isNeedSingleValueChangeInputElement(createInput(type))).toBe(true)
    })

    it.each(['text', 'datetime', 'number', 'dates', 'mytime', 'datetime-local2'])('is false for an input of type %s', (type) => {
      expect(isNeedSingleValueChangeInputElement(createInput(type))).toBe(false)
    })

    it('is false for an element that is not an input', () => {
      const div = document.createElement('div')

      div.setAttribute('type', 'date')

      expect(isNeedSingleValueChangeInputElement(div)).toBe(false)
    })
  })
})
