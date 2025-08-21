import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FilterTaggedContent } from '../FilterTaggedContent'
import { LineDecoder } from '../LineDecoder'
import { StringDecoder } from 'string_decoder'
import { Writable } from 'stream'
import { writeWithBackpressure } from '../writeWithBackpressure'

vi.mock('node:string_decoder', () => {
  return {
    StringDecoder: vi.fn(),
  }
})

vi.mock('../LineDecoder', () => {
  return {
    LineDecoder: vi.fn(),
  }
})

vi.mock('../writeWithBackpressure', () => {
  return {
    writeWithBackpressure: vi.fn(),
  }
})

describe('FilterTaggedContent', () => {
  const ENCODING_UTF8 = 'utf8'
  const ENCODING_BUFFER = 'buffer' as any
  const START_TAG = '<tag>'
  const END_TAG = '</tag>'

  const TEST_LINES = {
    ONE: 'one',
    TWO: `two`,
    THREE: 'three',
    FOUR: `four`,
    FIVE: `five`,
  }

  let filter: FilterTaggedContent
  let wasteStream: Writable
  let mockLineDecoder: any
  let mockStringDecoder: any

  beforeEach(() => {
    vi.clearAllMocks()

    wasteStream = new Writable()

    mockLineDecoder = {
      write: vi.fn(),
      [Symbol.iterator]: vi.fn(),
      end: vi.fn(),
    }

    mockStringDecoder = {
      write: vi.fn(),
    }

    vi.mocked(LineDecoder).mockImplementation(() => mockLineDecoder)
    vi.mocked(StringDecoder).mockImplementation(() => mockStringDecoder)

    filter = new FilterTaggedContent(START_TAG, END_TAG, wasteStream)
    vi.spyOn(filter, 'push')
    vi.mocked(writeWithBackpressure).mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('transform', () => {
    beforeEach(() => {
      mockLineDecoder[Symbol.iterator].mockReturnValue([][Symbol.iterator]())
    })

    describe('when the string decoder is not initialized', () => {
      describe('and the encoding is buffer', () => {
        it('initializes the string decoder with utf8', () => {
          filter.transform(Buffer.from(''), ENCODING_BUFFER, vi.fn())
          expect(StringDecoder).toHaveBeenCalledWith(ENCODING_UTF8)
        })
      })

      describe('and the encoding is utf8', () => {
        it('initializes the string decoder', () => {
          filter.transform(Buffer.from(''), ENCODING_UTF8, vi.fn())
          expect(StringDecoder).toHaveBeenCalledWith(ENCODING_UTF8)
        })
      })
    })

    describe('when the line decoder is not initialized', () => {
      it('initializes the line decoder', () => {
        filter.transform(Buffer.from(''), ENCODING_UTF8, vi.fn())
        expect(LineDecoder).toHaveBeenCalled()
      })
    })

    it('writes to the string decoder', () => {
      const buf = Buffer.from(TEST_LINES.ONE)

      filter.transform(buf, ENCODING_UTF8, vi.fn())
      expect(mockStringDecoder.write).toHaveBeenCalledWith(buf)
    })

    it('handles errors during transform', async () => {
      const error = new Error('Transform error')
      const next = vi.fn()

      mockStringDecoder.write.mockImplementation(() => {
        throw error
      })

      await filter.transform(Buffer.from(TEST_LINES.ONE), ENCODING_UTF8, next)

      expect(next).toHaveBeenCalledWith(error)
    })

    describe('when the string decoder returns a string', () => {
      beforeEach(() => {
        mockStringDecoder.write.mockReturnValue(TEST_LINES.ONE)
      })

      it('writes to the line decoder and string decoder', () => {
        filter.transform(Buffer.from(TEST_LINES.ONE, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
        expect(mockLineDecoder.write).toHaveBeenCalledWith(TEST_LINES.ONE)
      })

      describe('and the line decoder returns a line with no tags', () => {
        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_LINES.ONE][Symbol.iterator]())
        })

        it('pushes to the main stream', () => {
          filter.transform(Buffer.from(''), ENCODING_UTF8, vi.fn())
          expect(mockLineDecoder.write).toHaveBeenCalledWith(TEST_LINES.ONE)
        })
      })

      describe('and the line decoder returns a line with a start tag', () => {
        const TEST_STRING = `${START_TAG}${TEST_LINES.ONE}`

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes to the waste stream', () => {
          filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
        })
      })

      describe('and the line decoder returns a line with an end tag', () => {
        const TEST_STRING = `${TEST_LINES.ONE}${END_TAG}`

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes to the waste stream', () => {
          filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
        })
      })

      describe('and the line decoder returns a line with both start and end tags', () => {
        const TEST_STRING = `${START_TAG}${TEST_LINES.ONE}${END_TAG}`

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes to the waste stream', async () => {
          await filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
        })
      })

      describe('and the line decoder returns a line with content before start tag', () => {
        const TEST_STRING = `${TEST_LINES.ONE}${START_TAG}${TEST_LINES.TWO}`

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes content before tag to the main stream and tagged content to the waste stream', async () => {
          await filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
          expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.TWO, ENCODING_UTF8))
        })
      })

      describe('and the line decoder returns a line with content after end tag', () => {
        const TEST_STRING = `${START_TAG}${TEST_LINES.ONE}${END_TAG}${TEST_LINES.TWO}`

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes tagged content to waste stream and content after tag to main pipeline', async () => {
          await filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(writeWithBackpressure, 'wasteStream.write').toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
          expect(filter.push, 'filter.push').toHaveBeenCalledWith(Buffer.from(TEST_LINES.TWO, ENCODING_UTF8))
        })
      })

      describe('and the line decoder returns a line with only end tag and content after', () => {
        const TEST_STRING = `${TEST_LINES.ONE}${END_TAG}${TEST_LINES.TWO}`

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes content before end tag to waste stream and content after tag to main pipeline', async () => {
          await filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
          expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.TWO, ENCODING_UTF8))
        })
      })

      describe('and the line decoder returns a line with content before and after tags', () => {
        const TEST_STRING = `${TEST_LINES.ONE}${START_TAG}${TEST_LINES.TWO}${END_TAG}${TEST_LINES.THREE}`

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes content before tag to main pipeline, tagged content to waste stream, and content after tag to main pipeline', async () => {
          await filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
          expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.TWO, ENCODING_UTF8))
          expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.THREE, ENCODING_UTF8))
        })
      })

      describe('and the line decoder returns an empty line', () => {
        const TEST_STRING = ''

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes empty string to main pipeline', async () => {
          await filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_STRING))
        })
      })

      describe('and the line decoder returns a line with only whitespace', () => {
        const TEST_STRING = '   \n'

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_STRING][Symbol.iterator]())
        })

        it('writes whitespace to main pipeline', async () => {
          await filter.transform(Buffer.from(TEST_STRING, ENCODING_UTF8), ENCODING_UTF8, vi.fn())
          expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_STRING))
        })
      })
    })
  })

  describe('flush', () => {
    beforeEach(() => {
      mockLineDecoder.end.mockReturnValue([][Symbol.iterator]())
    })

    it('processes remaining lines from LineDecoder.end()', async () => {
      const callback = vi.fn()
      const remainingLines = [TEST_LINES.ONE]

      mockLineDecoder.end.mockReturnValue(remainingLines[Symbol.iterator]())

      await filter.flush(callback)

      expect(mockLineDecoder.end).toHaveBeenCalledWith()
      expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.ONE))
      expect(callback).toHaveBeenCalledWith()
    })

    it('handles empty remaining lines', async () => {
      const callback = vi.fn()

      await filter.flush(callback)

      expect(mockLineDecoder.end).toHaveBeenCalledWith()
      expect(callback).toHaveBeenCalledWith()
    })

    it('handles undefined LineDecoder', async () => {
      const callback = vi.fn()
      const newFilter = new FilterTaggedContent(START_TAG, END_TAG, wasteStream)

      await newFilter.flush(callback)

      expect(callback).toHaveBeenCalledWith()
    })

    it('handles errors during flush', async () => {
      const callback = vi.fn()
      const error = new Error('Flush error')

      mockLineDecoder.end.mockImplementation(() => {
        throw error
      })

      await filter.flush(callback)

      expect(callback).toHaveBeenCalledWith(error)
    })
  })

  describe('integration scenarios', () => {
    it('handles multi-line tagged content', async () => {
      const multiLineContent = `${START_TAG}${TEST_LINES.ONE}\n${TEST_LINES.TWO}\n${TEST_LINES.THREE}${END_TAG}`
      const chunk = Buffer.from(multiLineContent)
      const next = vi.fn()
      const lines = [
        `${START_TAG}${TEST_LINES.ONE}`,
        TEST_LINES.TWO,
        `${TEST_LINES.THREE}${END_TAG}`,
      ]

      mockStringDecoder.write.mockReturnValue(multiLineContent)
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.TWO, ENCODING_UTF8))
      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.THREE, ENCODING_UTF8))
    })

    it('handles multiple tagged sections across lines', async () => {
      const multiSectionContent = `${START_TAG}${TEST_LINES.ONE}${END_TAG}\n${START_TAG}${TEST_LINES.TWO}${END_TAG}`
      const chunk = Buffer.from(multiSectionContent)
      const next = vi.fn()
      const lines = [
        `${START_TAG}${TEST_LINES.ONE}${END_TAG}`,
        `${START_TAG}${TEST_LINES.TWO}${END_TAG}`,
      ]

      mockStringDecoder.write.mockReturnValue(multiSectionContent)
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.TWO, ENCODING_UTF8))
    })

    it('handles content with tags and surrounding text', async () => {
      const contentWithText = `${TEST_LINES.ONE}${START_TAG}${TEST_LINES.TWO}${END_TAG}${TEST_LINES.THREE}`
      const chunk = Buffer.from(contentWithText)
      const next = vi.fn()
      const lines = [contentWithText]

      mockStringDecoder.write.mockReturnValue(contentWithText)
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.ONE))
      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.TWO))
      expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.THREE))
    })

    it('handles partial lines across multiple chunks', async () => {
      const chunk1 = Buffer.from(`${TEST_LINES.ONE}${START_TAG}${TEST_LINES.TWO}`)
      const chunk2 = Buffer.from(`${TEST_LINES.THREE}${END_TAG}${TEST_LINES.FOUR}`)
      const next = vi.fn()

      mockStringDecoder.write
      .mockReturnValueOnce(`${TEST_LINES.ONE}${START_TAG}${TEST_LINES.TWO}`)
      .mockReturnValueOnce(`${TEST_LINES.THREE}${END_TAG}${TEST_LINES.FOUR}`)

      mockLineDecoder[Symbol.iterator]
      .mockReturnValueOnce([][Symbol.iterator]()) // First chunk has no complete lines
      .mockReturnValueOnce([`${TEST_LINES.ONE}${START_TAG}${TEST_LINES.TWO}${TEST_LINES.THREE}${END_TAG}${TEST_LINES.FOUR}`][Symbol.iterator]()) // Second chunk completes the line

      await filter.transform(chunk1, ENCODING_UTF8, next)
      await filter.transform(chunk2, ENCODING_UTF8, next)

      expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(`${TEST_LINES.TWO}${TEST_LINES.THREE}`, ENCODING_UTF8))
      expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.FOUR, ENCODING_UTF8))
    })

    it('handles mixed tagged and untagged content', async () => {
      const mixedContent = `${TEST_LINES.ONE}\n${START_TAG}${TEST_LINES.TWO}${END_TAG}\n${TEST_LINES.THREE}`
      const chunk = Buffer.from(mixedContent)
      const next = vi.fn()
      const lines = [
        TEST_LINES.ONE,
        `${START_TAG}${TEST_LINES.TWO}${END_TAG}`,
        TEST_LINES.THREE,
      ]

      mockStringDecoder.write.mockReturnValue(mixedContent)
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.ONE, ENCODING_UTF8))
      expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.TWO, ENCODING_UTF8))
      expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_LINES.THREE, ENCODING_UTF8))
    })
  })
})
