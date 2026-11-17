/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { canSetSelectionRangeElement, getFirstFixedOrStickyPositionParent } from '../../../../src/dom/elements/complexElements'

const createInput = (type: string) => {
  const input = document.createElement('input')

  input.setAttribute('type', type)

  return input
}

describe('dom/elements/complexElements', () => {
  describe('canSetSelectionRangeElement', () => {
    it.each(['text', 'search', 'tel', 'password', 'TEXT'])('is true for an input of type %s', (type) => {
      expect(canSetSelectionRangeElement(createInput(type))).toBe(true)
    })

    it.each(['email', 'number', 'date', 'checkbox'])('is false for an input of type %s', (type) => {
      expect(canSetSelectionRangeElement(createInput(type))).toBe(false)
    })

    it('is true for a textarea', () => {
      expect(canSetSelectionRangeElement(document.createElement('textarea'))).toBe(true)
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
