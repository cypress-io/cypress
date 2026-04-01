import humanInterval from 'human-interval'
import { describe, expect, it } from 'vitest'

import * as humanTime from '../../../lib/util/human_time'

describe('lib/util/human_time', () => {
  describe('.long', () => {
    it('outputs minutes + seconds', () => {
      expect(humanTime.long(humanInterval('2 minutes and 3 seconds'))).toBe('2 minutes, 3 seconds')
      expect(humanTime.long(humanInterval('65 minutes'))).toBe('65 minutes, 0 seconds')

      expect(humanTime.long(humanInterval('1 minute'))).toBe('1 minute, 0 seconds')
    })

    it('outputs seconds', () => {
      expect(humanTime.long(humanInterval('59 seconds'))).toBe('59 seconds')

      expect(humanTime.long(humanInterval('1 second'))).toBe('1 second')
    })
  })

  describe('.short', () => {
    it('outputs mins', () => {
      expect(humanTime.short(humanInterval('2 minutes and 3 seconds'))).toBe('2m, 3s')
      expect(humanTime.short(humanInterval('65 minutes'))).toBe('65m')

      expect(humanTime.short(humanInterval('1 minute'))).toBe('1m')
    })

    it('outputs seconds', () => {
      expect(humanTime.short(humanInterval('59 seconds'))).toBe('59s')
      expect(humanTime.short(humanInterval('1 second'))).toBe('1s')
      expect(humanTime.short(0)).toBe('0s')
      expect(humanTime.short(500)).toBe('500ms')

      expect(humanTime.short(10)).toBe('10ms')
    })
  })
})
