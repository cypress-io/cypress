import { describe, it, expect } from 'vitest'
import { format } from '../../../lib/util/duration'

describe('lib/util/duration', () => {
  describe('.format', () => {
    it('formats ms', () => {
      expect(format(496)).toBe('496ms')
    })

    it('formats 1 digit secs', () => {
      expect(format(1000)).toBe('00:01')
    })

    it('formats 2 digit secs', () => {
      expect(format(21000)).toBe('00:21')
    })

    it('formats mins and secs', () => {
      expect(format(321000)).toBe('05:21')
    })

    it('formats 2 digit mins and secs', () => {
      expect(format(3330000)).toBe('55:30')
    })

    it('formats hours with mins', () => {
      expect(format(33300000)).toBe('9:15:00')
    })

    it('formats durations of 24 hours or more', () => {
      expect(format(24 * 3600000)).toBe('24:00:00')
      expect(format(25 * 3600000 + 61000)).toBe('25:01:01')
      expect(format(26 * 3600000 + 5000)).toBe('26:00:05')
    })
  })
})
