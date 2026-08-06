import { describe, expect, it } from 'vitest'

import { parsePositiveInt } from '../../../lib/tap/utils'
import { FrameCommandError } from '../../../lib/tap/aut/frame'

describe('lib/tap/utils parsePositiveInt', () => {
  it('falls back when the value is absent', () => {
    expect(parsePositiveInt(undefined, 200, 'max-nodes')).to.eq(200)
  })

  it('parses a positive integer', () => {
    expect(parsePositiveInt('50', 200, 'max-nodes')).to.eq(50)
  })

  it('rejects zero, negatives, and non-integers with INVALID_LIMIT', () => {
    for (const bad of ['0', '-5', '1.5', 'abc']) {
      expect(() => parsePositiveInt(bad, 200, 'max-nodes')).to.throw(FrameCommandError).that.includes({ code: 'INVALID_LIMIT' })
    }
  })
})
