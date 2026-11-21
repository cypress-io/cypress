/**
 * @vitest-environment jsdom
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import _ from '../../../src/config/lodash'
import $visibility from '../../../src/dom/visibility'

// jsdom has no layout, so every element has no width or height, which makes
// an `overflow: hidden` parent hide its children unless one of them escapes it
describe('dom/visibility', () => {
  // jQuery's patched `matchesSelector` calls the `_` global, which Cypress sets in the browser
  beforeAll(() => {
    vi.stubGlobal('_', _)
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  describe('isHiddenByAncestors', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="clipper" style="overflow: hidden"><div id="middle"><span id="child"></span></div></div>'
      // A fixed element is visible when it is the topmost one at its center
      document.elementFromPoint = () => document.getElementById('child')
    })

    afterEach(() => {
      // @ts-expect-error - jsdom does not implement it, so remove the stub
      delete document.elementFromPoint
    })

    const setPosition = (id: string, position: string) => {
      document.getElementById(id)!.style.position = position
    }

    const isChildHiddenByClipper = () => $visibility.isHiddenByAncestors(document.getElementById('child'))

    it('is hidden by a parent with overflow hidden and no size', () => {
      expect(isChildHiddenByClipper()).toBe(true)
    })

    it.each([
      ['child', 'absolute'],
      ['child', 'fixed'],
      ['middle', 'absolute'],
      ['middle', 'fixed'],
    ])('is not hidden by it when #%s has position %s', (id, position) => {
      setPosition(id, position)

      expect(isChildHiddenByClipper()).toBe(false)
    })

    it.each(['relative', 'static', 'sticky'])('is still hidden by it when the child has position %s', (position) => {
      setPosition('child', position)

      expect(isChildHiddenByClipper()).toBe(true)
    })
  })
})
