import chai from 'chai'
import { describe, expect, it } from 'vitest'

import { create } from '../../../../src/cy/chai/inspect'

describe('cy/chai/inspect', () => {
  it('should truncate long strings the same way as chai', () => {
    const { inspect } = create(chai)
    const value = 'a'.repeat(10000)
    const expected = `'${'a'.repeat(chai.config.truncateThreshold - 3)}\u2026'`

    expect(inspect(value)).to.equal(expected)
  })
})
