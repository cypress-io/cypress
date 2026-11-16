import { describe, it, expect } from 'vitest'
import { strip, SEPARATOR } from '../../../lib/util/cache_buster'

describe('lib/cache_buster', () => {
  describe('#strip', () => {
    it('strips cache buster', () => {
      const rand = SEPARATOR + Math.random().toFixed(3).slice(2, 5)
      const file = `foo.js${rand}`

      expect(strip(file)).toBe('foo.js')
    })

    it('is noop without cache buster', () => {
      const file = 'foo.js'

      expect(strip(file)).toBe('foo.js')
    })
  })
})
