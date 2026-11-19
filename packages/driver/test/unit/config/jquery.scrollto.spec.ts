/**
 * @vitest-environment jsdom
 */
import $ from 'jquery'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '../../../src/config/jquery'

const scrollTo = (container: HTMLElement, target: number | string) => {
  return new Promise<void>((resolve) => {
    $(container).scrollTo(target, { axis: 'y', onAfter: () => resolve() })
  })
}

describe('src/config/jquery.scrollto', () => {
  let container: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <div id="intro"></div>
        <div id="target"></div>
      </div>
    `

    container = document.getElementById('container')!

    // jsdom does no layout, so give the container a scrollable range for the
    // plugin's `limit` clamp to work against.
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 })
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 200 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('scrolls a container to the element a selector string matches', async () => {
    vi.spyOn($.fn, 'offset').mockImplementation(function (this: JQuery) {
      return this[0]?.id === 'target' ? { top: 350, left: 0 } : { top: 50, left: 0 }
    })

    await scrollTo(container, '#target')

    expect(container.scrollTop).toBe(300)
  })

  it.each<[number | string, number]>([
    [120, 120],
    ['120px', 120],
    ['50%', 400],
    ['max', 800],
  ])('scrolls a container to the position %j', async (target, expected) => {
    await scrollTo(container, target)

    expect(container.scrollTop).toBe(expected)
  })

  describe('telling a position string from a selector', () => {
    const scrollAndGetAnimation = (target: string) => {
      const animate = vi.spyOn($.fn, 'animate').mockImplementation(function (this: JQuery) {
        return this
      })

      // `limit` is missing from the plugin's types. Turned off, it keeps the
      // position strings below from being clamped to the scrollable range.
      const settings = { axis: 'y' as const, limit: false }

      $(container).scrollTo(target, settings)

      return animate
    }

    it.each([
      '50',
      '50px',
      '12.5',
      '12.5px',
      '+=50',
      '-=50px',
      '+50',
      '-12.5px',
    ])('scrolls to the position %j', (target) => {
      const find = vi.spyOn($.fn, 'find')

      expect(scrollAndGetAnimation(target).mock.calls[0][0]).toEqual({ scrollTop: target })
      expect(find).not.toHaveBeenCalledWith(target)
    })

    // Stubbing `find` to match nothing keeps jQuery from parsing these as CSS,
    // where several would be syntax errors, and makes the plugin stop before
    // animating, as it does for a selector that matches no element.
    it.each([
      '#target',
      '50em',
      '.5px',
      '50.px',
      '*=50',
      '50px50',
    ])('looks %j up as a selector instead of scrolling to it', (target) => {
      const find = vi.spyOn($.fn, 'find').mockReturnValue($())

      expect(scrollAndGetAnimation(target)).not.toHaveBeenCalled()
      expect(find).toHaveBeenCalledWith(target)
    })
  })
})
