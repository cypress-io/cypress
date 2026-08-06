import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderAmbiguousHuman } from '../../../lib/tap/render/ambiguous'
import type { FrameAmbiguousResult } from '../../../lib/tap/aut/single-match'

const render = (result: FrameAmbiguousResult): string => stripAnsi(renderAmbiguousHuman(result))

describe('lib/tap/render/ambiguous', () => {
  it('states what went wrong, then the way through', () => {
    expect(render({ ambiguous: true, selector: '.item', count: 2 })).toBe([
      '⚠ selector \'.item\' matched 2 elements but must be unique',
      'pass --at <index> to read one of them (0-1)',
    ].join('\n'))
  })

  it('quotes a selector carrying a single quote so it pastes back into a shell', () => {
    expect(render({ ambiguous: true, selector: '[data-x="it\'s"]', count: 3 })).toContain(
      'selector \'[data-x="it\'\\\'\'s"]\' matched 3 elements',
    )
  })
})
