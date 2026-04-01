import { describe, expect, it } from 'vitest'

import * as duration from '../../../lib/util/duration'

describe('lib/util/duration', () => {
  describe('.format', () => {
    it('formats ms', () => {
      expect(duration.format(496)).toBe('496ms')
    })

    it('formats 1 digit secs', () => {
      expect(duration.format(1000)).toBe('00:01')
    })

    it('formats 2 digit secs', () => {
      expect(duration.format(21000)).toBe('00:21')
    })

    it('formats mins and secs', () => {
      expect(duration.format(321000)).toBe('05:21')
    })

    it('formats 2 digit mins and secs', () => {
      expect(duration.format(3330000)).toBe('55:30')
    })

    it('formats hours with mins', () => {
      expect(duration.format(33300000)).toBe('9:15:00')
    })
  })
})
