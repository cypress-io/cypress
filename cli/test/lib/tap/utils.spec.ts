import { describe, expect, it } from 'vitest'

import { parseIndex, parsePositiveInt } from '../../../lib/tap/utils'
import { TapError } from '@packages/cypress-instances'

// Every input shape both parsers must reject, shared so they reject the same
// class: text `Number()` coerces to a number that passes an isInteger check,
// and runs of digits long enough to leave the safe-integer range.
const MALFORMED = ['', ' ', '   ', '\t', '\n', 'abc', '1.5', '-1', '-5', '0x10', '1e3', '  7  ', '+3', 'Infinity', 'NaN', '9007199254740993', '9'.repeat(400), null, ['1', '2'], ['5'], 7, {}]

describe('lib/tap/utils parseIndex', () => {
  it('reads no index when the flag is absent', () => {
    expect(parseIndex(undefined)).to.eq(undefined)
  })

  it('parses a 0-based index', () => {
    expect(parseIndex('0')).to.eq(0)
    expect(parseIndex('3')).to.eq(3)
  })

  it('rejects every malformed value, naming the flag and what it takes', () => {
    for (const bad of MALFORMED) {
      expect(() => parseIndex(bad as any), JSON.stringify(bad)).to.throw(TapError).that.includes({ code: 'INVALID_VALUE' })
    }
  })

  it('reports the value it was given', () => {
    expect(() => parseIndex('abc')).to.throw(TapError).that.includes({
      detail: 'Expected `--at` to be a whole number, 0 or greater.\n\nInstead the value was: "abc"',
    })
  })
})

describe('lib/tap/utils parsePositiveInt', () => {
  it('falls back when the value is absent', () => {
    expect(parsePositiveInt(undefined, 200, 'max-nodes')).to.eq(200)
  })

  it('parses a positive integer, up to the largest one that survives the round trip', () => {
    expect(parsePositiveInt('50', 200, 'max-nodes')).to.eq(50)
    expect(parsePositiveInt('9007199254740991', 200, 'max-nodes')).to.eq(Number.MAX_SAFE_INTEGER)
  })

  it('rejects zero and every malformed value, naming the flag and what it takes', () => {
    for (const bad of ['0', ...MALFORMED]) {
      expect(() => parsePositiveInt(bad as any, 200, 'max-nodes'), JSON.stringify(bad)).to.throw(TapError).that.includes({ code: 'INVALID_VALUE' })
    }
  })

  it('names the flag it was parsing, which the two commands share', () => {
    expect(() => parsePositiveInt('0', 200, 'max-nodes')).to.throw(TapError).that.includes({
      detail: 'Expected `--max-nodes` to be a positive integer.\n\nInstead the value was: "0"',
    })
  })
})
