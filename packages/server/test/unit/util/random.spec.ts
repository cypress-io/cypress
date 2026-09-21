import randomstring from 'randomstring'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { id as randomId } from '../../../lib/util/random'

describe('.id', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns random.generate string with length 5 by default', () => {
    const generateSpy = vi.spyOn(randomstring, 'generate')

    const id = randomId()

    expect(id.length).toBe(5)

    expect(generateSpy).toHaveBeenCalledWith({
      length: 5,
      capitalization: 'lowercase',
    })
  })

  it('passes the length parameter if supplied', () => {
    const generateSpy = vi.spyOn(randomstring, 'generate')

    const id = randomId(32)

    expect(id.length).toBe(32)

    expect(generateSpy).toHaveBeenCalledWith({
      length: 32,
      capitalization: 'lowercase',
    })
  })
})
