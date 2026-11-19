import { describe, it, expect, vi, afterEach } from 'vitest'
import crypto from 'crypto'
import { id as randomId } from '../../../lib/util/random'

describe('.id', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a 5 character lowercase alphanumeric string by default', () => {
    const randomInt = vi.spyOn(crypto, 'randomInt')

    expect(randomId()).toMatch(/^[0-9a-z]{5}$/)
    expect(randomInt).toHaveBeenCalledTimes(5)
  })

  it('returns a string of the supplied length', () => {
    const randomInt = vi.spyOn(crypto, 'randomInt')

    expect(randomId(64)).toMatch(/^[0-9a-z]{64}$/)
    expect(randomInt).toHaveBeenCalledTimes(64)
  })

  it('draws each character from crypto.randomInt over the full 0-9a-z alphabet', () => {
    const values = [0, 9, 10, 35]
    const randomInt = vi.spyOn(crypto, 'randomInt').mockImplementation(() => values.shift())

    expect(randomId(4)).toBe('09az')
    expect(randomInt.mock.calls).toEqual([[36], [36], [36], [36]])
  })

  it('throws when crypto throws instead of falling back to a weaker source', () => {
    vi.spyOn(crypto, 'randomInt').mockImplementation(() => {
      throw new Error('crypto unavailable')
    })

    expect(() => randomId()).toThrow('crypto unavailable')
  })
})
