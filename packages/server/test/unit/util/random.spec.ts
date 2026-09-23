import { afterEach, describe, expect, it, vi } from 'vitest'
import randomstring from 'randomstring'
import { id as randomId } from '../../../lib/util/random'

describe('.id', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns random.generate string with length 5 by default', () => {
    vi.spyOn(randomstring, 'generate')

    const id = randomId()

    expect(id.length).toEqual(5)

    expect(randomstring.generate).toHaveBeenCalledWith({
      length: 5,
      capitalization: 'lowercase',
    })
  })

  it('passes the length parameter if supplied', () => {
    vi.spyOn(randomstring, 'generate')

    const id = randomId(32)

    expect(id.length).toEqual(32)

    expect(randomstring.generate).toHaveBeenCalledWith({
      length: 32,
      capitalization: 'lowercase',
    })
  })
})
