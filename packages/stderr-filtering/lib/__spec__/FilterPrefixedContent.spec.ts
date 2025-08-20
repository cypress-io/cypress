import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FilterPrefixedContent } from '../FilterPrefixedContent'
import { LineDecoder } from '../LineDecoder'
import { StringDecoder } from 'string_decoder'
import { writeWithBackpressure } from '../writeWithBackpressure'
import { Writable } from 'stream'

vi.mock('../LineDecoder', () => {
  return {
    LineDecoder: vi.fn(),
  }
})

vi.mock('string_decoder', () => {
  return {
    StringDecoder: vi.fn(),
  }
})

vi.mock('../writeWithBackpressure', () => {
  return {
    writeWithBackpressure: vi.fn(),
  }
})

describe('FilterPrefixedContent', () => {
  // Test constants
  const ERROR_PREFIX = /^ERROR:/
  const ENCODING_UTF8 = 'utf8'
  const ENCODING_BUFFER = 'buffer' as any

  // Test data
  const TEST_LINES = {
    ERROR: 'ERROR: test error\n',
    INFO: 'INFO: test info\n',
    WARN: 'WARN: warning message\n',
    FATAL: 'FATAL: critical error\n',
    EMPTY: '\n',
  }

  const TEST_DATA = {
    SINGLE_LINE_TEXT: 'test data\n',
    MULTI_LINE_TEXT: 'ERROR: test error\nINFO: test info\n',
    PARTIAL_TEXT_1: 'ERROR: Partial',
    PARTIAL_TEXT_2: ' error message\n',
    COMPLETE_PARTIAL: 'ERROR: Partial error message\n',
  }

  const TEST_CHUNKS = {
    SINGLE_LINE: Buffer.from('test data\n'),
    MULTI_LINE: Buffer.from('ERROR: test error\nINFO: test info\n'),
    COMPLEX: Buffer.from('ERROR: First error\nINFO: First info\nERROR: Second error\nINFO: Second info\n'),
    PARTIAL_1: Buffer.from('ERROR: Partial'),
    PARTIAL_2: Buffer.from(' error message\n'),
  }

  let filter: FilterPrefixedContent
  let wasteStream: Writable
  let mockLineDecoder: any
  let mockStringDecoder: any

  beforeEach(() => {
    vi.clearAllMocks()

    wasteStream = new Writable()

    mockLineDecoder = {
      write: vi.fn(),
      [Symbol.iterator]: vi.fn().mockReturnValue([][Symbol.iterator]()),
      end: vi.fn(),
    }

    mockStringDecoder = {
      write: vi.fn().mockImplementation((chunk) => {
        return chunk.toString()
      }),
    }

    vi.mocked(LineDecoder).mockImplementation(() => mockLineDecoder)
    vi.mocked(StringDecoder).mockImplementation(() => mockStringDecoder)

    filter = new FilterPrefixedContent(ERROR_PREFIX, wasteStream)
    vi.mocked(writeWithBackpressure).mockResolvedValue()
    vi.spyOn(filter, 'push')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('transform', () => {
    it('initializes StringDecoder and LineDecoder on first call', async () => {
      const chunk = TEST_CHUNKS.SINGLE_LINE
      const next = vi.fn()

      await filter.transform(chunk, ENCODING_UTF8, next)
      mockStringDecoder.write.mockReturnValue(TEST_DATA.SINGLE_LINE_TEXT)
      mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.SINGLE_LINE_TEXT][Symbol.iterator]())

      expect(StringDecoder).toHaveBeenCalledWith(ENCODING_UTF8)
      expect(LineDecoder).toHaveBeenCalled()
      expect(mockStringDecoder.write, 'string decoder write').toHaveBeenCalledWith(chunk)
      expect(mockLineDecoder.write, 'line decoder write').toHaveBeenCalledWith(TEST_DATA.SINGLE_LINE_TEXT)
      expect(next).toHaveBeenCalledWith()
    })

    it('handles buffer encoding correctly', async () => {
      const chunk = TEST_CHUNKS.SINGLE_LINE
      const next = vi.fn()

      mockLineDecoder[Symbol.iterator].mockReturnValue([][Symbol.iterator]())

      await filter.transform(chunk, ENCODING_BUFFER, next)

      expect(StringDecoder).toHaveBeenCalledWith(ENCODING_UTF8)
      expect(next).toHaveBeenCalledWith()
    })

    it('handles errors during processing', async () => {
      const chunk = TEST_CHUNKS.SINGLE_LINE
      const next = vi.fn()
      const error = new Error('Processing error')

      mockStringDecoder.write.mockImplementation(() => {
        throw error
      })

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(next).toHaveBeenCalledWith(error)
    })

    it('reuses existing StringDecoder and LineDecoder instances', async () => {
      const chunk1 = Buffer.from(TEST_DATA.SINGLE_LINE_TEXT)
      const chunk2 = Buffer.from(TEST_DATA.SINGLE_LINE_TEXT)
      const next = vi.fn()

      await filter.transform(chunk1, ENCODING_UTF8, next)
      await filter.transform(chunk2, ENCODING_UTF8, next)

      expect(StringDecoder).toHaveBeenCalledTimes(1)
      expect(LineDecoder).toHaveBeenCalledTimes(1)
    })

    describe('when the prefix is not found', () => {
      it('passes the line to the next stream', async () => {
        const chunk = Buffer.from(TEST_DATA.SINGLE_LINE_TEXT)
        const next = vi.fn()

        mockStringDecoder.write.mockReturnValue(TEST_DATA.SINGLE_LINE_TEXT)
        mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.SINGLE_LINE_TEXT][Symbol.iterator]())

        await filter.transform(chunk, ENCODING_UTF8, next)

        expect(filter.push).toHaveBeenCalledWith(Buffer.from(TEST_DATA.SINGLE_LINE_TEXT, ENCODING_UTF8))
        expect(next).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the prefix is found', () => {
      it('writes the line to the waste stream', async () => {
        const chunk = Buffer.from(TEST_LINES.ERROR)
        const next = vi.fn()

        mockStringDecoder.write.mockReturnValue(TEST_LINES.ERROR)
        mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_LINES.ERROR][Symbol.iterator]())

        await filter.transform(chunk, ENCODING_UTF8, next)

        expect(writeWithBackpressure).toHaveBeenCalledWith(wasteStream, Buffer.from(TEST_LINES.ERROR, ENCODING_UTF8))
        expect(next).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('flush', () => {
    beforeEach(() => {
      mockLineDecoder.end.mockReturnValue([][Symbol.iterator]())
    })

    it('processes remaining lines from LineDecoder.end()', async () => {
      const callback = vi.fn()
      const remainingLines = [TEST_LINES.ERROR, TEST_LINES.INFO]

      mockLineDecoder.end.mockReturnValue(remainingLines[Symbol.iterator]())

      await filter.flush(callback)

      expect(mockLineDecoder.end).toHaveBeenCalledWith()
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
      const newFilter = new FilterPrefixedContent(ERROR_PREFIX, wasteStream)

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
})
