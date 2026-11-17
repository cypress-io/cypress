/**
 * @vitest-environment jsdom
 */
import $ from 'jquery'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectVisibility } from '../../../src/dom/transform'

// jsdom does not compute `transform`, so hand detectVisibility the serialized
// matrix a browser's getComputedStyle would return
const detectVisibilityOfTransform = (transform: string) => {
  document.body.innerHTML = '<div id="el"></div>'

  vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const isEl = (el as Element).id === 'el'

    return {
      getPropertyValue: (prop: string) => {
        return {
          'backface-visibility': 'visible',
          'transform-style': 'flat',
          'transform': isEl ? transform : 'none',
        }[prop]
      },
    } as CSSStyleDeclaration
  })

  return detectVisibility($('#el'))
}

describe('dom/transform', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('detectVisibility', () => {
    it.each([
      'matrix(0, 0, 0, 1, 0, 0)',
      'matrix(1, 0, 0, 0, 0, 0)',
      'matrix(1e-9, 0, 1, 0, 0, 0)',
      'matrix(1E-9, 0, 1, 0, 0, 0)',
      'matrix(-1.5e+2, 0, 2.5, 0, -10, 20)',
      'matrix3d(0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
    ])('reads %s as scaled to zero', (transform) => {
      expect(detectVisibilityOfTransform(transform)).toBe('transformed')
    })

    it.each([
      'none',
      'matrix(1, 0, 0, 1, 0, 0)',
      'matrix(0.5, 0, 0, 0.5, -10.25, 20)',
      'matrix(0, 1e-9, -1e-9, 0, 0, 0)',
      'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1)',
      'matrix3d(1e-9, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
    ])('reads %s as visible', (transform) => {
      expect(detectVisibilityOfTransform(transform)).toBe('visible')
    })
  })
})
