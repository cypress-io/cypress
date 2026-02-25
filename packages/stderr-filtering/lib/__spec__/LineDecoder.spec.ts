import { describe, it, expect, vi } from 'vitest'
import { LineDecoder } from '../LineDecoder'
import { getEndTag } from '../tags'

vi.mock('../tags', () => {
  return {
    getEndTag: vi.fn(),
  }
})

describe('LineDecoder', () => {
  let decoder: LineDecoder

  const END_TAG = '_END_'

  beforeEach(() => {
    vi.mocked(getEndTag).mockReturnValue(END_TAG)
    decoder = new LineDecoder()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('when a chunk with a trailing newline is provided', () => {
    const firstChunk = 'one\n'

    beforeEach(() => {
      decoder.write(firstChunk)
    })

    it('should yield the line', () => {
      const lines = Array.from(decoder)

      expect(lines).toEqual([firstChunk])
    })

    describe('and then another chunk is provided', () => {
      const secondChunk = 'two\n'

      beforeEach(() => {
        decoder.write(secondChunk)
      })

      it('should yield the lines', () => {
        const lines = Array.from(decoder)

        expect(lines).toEqual([firstChunk, secondChunk])
      })

      describe('and the decoder is iterated through', () => {
        beforeEach(() => {
          // iterate through the decoder to empty the buffer
          Array.from(decoder)
        })

        it('should yield the lines', () => {
          const lines = Array.from(decoder)

          expect(lines).toEqual([])
        })
      })
    })
  })

  describe('when the only content in the buffer ends with override token and not a newline', () => {
    const str = 'Some Text'

    beforeEach(() => {
      decoder.write(`${str}${END_TAG}`)
    })

    it('yields the line as if the end tag were a newline', () => {
      const lines = Array.from(decoder)

      expect(lines).toEqual([`${str}${END_TAG}`])
    })
  })
})
