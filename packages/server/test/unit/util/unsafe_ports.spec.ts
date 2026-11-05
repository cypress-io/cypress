import { describe, expect, it } from 'vitest'
import { isUnsafePort } from '../../../lib/util/unsafe_ports'

describe('lib/util/unsafe_ports', () => {
  it('flags ports browsers refuse to load', () => {
    // 1 and 69 are long-standing restricted ports, 10080 was added when the
    // NAT slipstreaming fix blocked it in Chromium
    for (const port of [1, 20, 69, 10080]) {
      expect(isUnsafePort(port), `port ${port}`).toBe(true)
    }
  })

  it('allows ordinary application ports', () => {
    for (const port of [80, 3000, 8080, 54321, 65535]) {
      expect(isUnsafePort(port), `port ${port}`).toBe(false)
    }
  })
})
