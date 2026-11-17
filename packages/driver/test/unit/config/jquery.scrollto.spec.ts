/**
 * @vitest-environment jsdom
 */
import $ from 'jquery'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '../../../src/config/jquery'

const scrollAndGetAnimatedProps = (target: string) => {
  const animate = vi.spyOn($.fn, 'animate').mockImplementation(function (this: JQuery) {
    return this
  })

  // `limit` is missing from the plugin's types. Turned off, it keeps jsdom's
  // zero scroll size from clamping every position to 0.
  const settings = { axis: 'y' as const, limit: false }

  $('#container').scrollTo(target, settings)

  return animate.mock.calls[0][0]
}

describe('src/config/jquery.scrollto', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="container"><div id="target"></div></div>'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

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

    expect(scrollAndGetAnimatedProps(target)).toEqual({ scrollTop: target })
    expect(find).not.toHaveBeenCalledWith(target)
  })

  it('scrolls to a percentage of the scrollable height', () => {
    expect(scrollAndGetAnimatedProps('50%')).toHaveProperty('scrollTop', expect.any(Number))
  })

  // Upstream lets a selector fall through to the element branch; here it does
  // not, so the scroll itself fails. Only the choice of branch is under test.
  it.each([
    '#target',
    '50em',
    '.5px',
    '50.px',
    '*=50',
    '50px50',
  ])('treats %j as a selector, not a position', (target) => {
    const find = vi.spyOn($.fn, 'find')

    expect(() => scrollAndGetAnimatedProps(target)).toThrow()
    expect(find).toHaveBeenCalledWith(target)
  })
})
