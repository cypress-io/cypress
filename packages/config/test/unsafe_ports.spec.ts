import { describe, expect, it } from 'vitest'
import { isUnsafePort } from '../src/unsafe_ports'

describe('unsafe_ports', () => {
  it('flags ports browsers refuse to load', () => {
    for (const port of [1, 20, 69, 4190, 6679, 10080]) {
      expect(isUnsafePort(port), `port ${port}`).toBe(true)
    }
  })

  it('allows ordinary application ports', () => {
    for (const port of [80, 3000, 8080, 54321, 65535]) {
      expect(isUnsafePort(port), `port ${port}`).toBe(false)
    }
  })
})
