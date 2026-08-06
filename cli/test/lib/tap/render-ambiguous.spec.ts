import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderAmbiguousHuman } from '../../../lib/tap/render/ambiguous'
import type { FrameAmbiguousResult } from '../../../lib/tap/aut/single-match'

const render = (result: FrameAmbiguousResult): string => stripAnsi(renderAmbiguousHuman(result))

const numbered = (...selectors: string[]) => selectors.map((selector, index) => ({ index, selector }))

describe('lib/tap/render/ambiguous', () => {
  it('states what went wrong, then numbers a selector per match', () => {
    expect(render({
      ambiguous: true,
      selector: 'div',
      count: 5,
      selectors: numbered('.container', '.navbar-header', '#navbar', '.todoapp', '.view'),
    })).toBe([
      '⚠ selector \'div\' matched 5 elements but must be unique',
      'provide --at with an index to select an element from the list or update the selector.',
      'index  selector',
      '0      \'.container\'',
      '1      \'.navbar-header\'',
      '2      \'#navbar\'',
      '3      \'.todoapp\'',
      '4      \'.view\'',
    ].join('\n'))
  })

  it('keeps a row for a match no selector could be derived for', () => {
    // The second of four matches had no unique selector, but --at still reads it,
    // so it keeps its index and the dash stands in for the selector it lacks.
    expect(render({
      ambiguous: true,
      selector: 'li',
      count: 4,
      selectors: [{ index: 0, selector: '#first' }, { index: 2, selector: '#third' }, { index: 3, selector: '#fourth' }],
    })).toBe([
      '⚠ selector \'li\' matched 4 elements but must be unique',
      'provide --at with an index to select an element from the list or update the selector.',
      'index  selector',
      '0      \'#first\'',
      '1      -',
      '2      \'#third\'',
      '3      \'#fourth\'',
    ].join('\n'))
  })

  it('numbers every match when no selector could be derived for any of them', () => {
    expect(render({ ambiguous: true, selector: '.item', count: 2, selectors: [] })).toBe([
      '⚠ selector \'.item\' matched 2 elements but must be unique',
      'provide --at with an index to select an element from the list or update the selector.',
      'index  selector',
      '0      -',
      '1      -',
    ].join('\n'))
  })
})
