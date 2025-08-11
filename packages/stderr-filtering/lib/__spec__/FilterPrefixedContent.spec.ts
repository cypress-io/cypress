import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Transform, Writable } from 'stream'
import { FilterPrefixedContent } from '../FilterPrefixedContent'

// Mock dependencies
vi.mock('../SplitStream')
vi.mock('../LineDecoder')
vi.mock('node:string_decoder')

const { SplitStream } = await import('../SplitStream')
const { LineDecoder } = await import('../LineDecoder')
const { StringDecoder } = await import('node:string_decoder')

describe('FilterPrefixedContent', () => {
  // Test constants
  const ERROR_PREFIX = /^ERROR:/
  const COMPLEX_PREFIX = /^(ERROR|WARN|FATAL):/
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
  let mockFilteredStream: Writable
  let mockSplitStream: any
  let mockLineDecoder: any
  let mockStringDecoder: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockFilteredStream = new Writable()

    mockSplitStream = {
      writeLeft: vi.fn().mockResolvedValue(undefined),
      writeRight: vi.fn().mockResolvedValue(undefined),
    }

    mockLineDecoder = {
      write: vi.fn(),
      [Symbol.iterator]: vi.fn(),
      end: vi.fn(),
    }

    mockStringDecoder = {
      write: vi.fn(),
    }

    vi.mocked(SplitStream).mockImplementation(() => mockSplitStream)
    vi.mocked(LineDecoder).mockImplementation(() => mockLineDecoder)
    vi.mocked(StringDecoder).mockImplementation(() => mockStringDecoder)

    filter = new FilterPrefixedContent(ERROR_PREFIX, mockFilteredStream)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('creates a Transform stream with correct configuration', () => {
      expect(filter).toBeInstanceOf(Transform)
      expect(filter).toBeInstanceOf(FilterPrefixedContent)
    })

    it('initializes SplitStream with correct parameters', () => {
      expect(SplitStream).toHaveBeenCalledWith(mockFilteredStream, filter)
    })
  })

  describe('transform', () => {
    beforeEach(() => {
      mockStringDecoder.write.mockReturnValue(TEST_DATA.SINGLE_LINE_TEXT)
      mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.SINGLE_LINE_TEXT][Symbol.iterator]())
    })

    it('initializes StringDecoder and LineDecoder on first call', async () => {
      const chunk = TEST_CHUNKS.SINGLE_LINE
      const next = vi.fn()

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(StringDecoder).toHaveBeenCalledWith(ENCODING_UTF8)
      expect(LineDecoder).toHaveBeenCalled()
      expect(mockStringDecoder.write).toHaveBeenCalledWith(chunk)
      expect(mockLineDecoder.write).toHaveBeenCalledWith(TEST_DATA.SINGLE_LINE_TEXT)
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

    it('processes lines and routes them correctly', async () => {
      const chunk = TEST_CHUNKS.MULTI_LINE
      const next = vi.fn()
      const lines = [TEST_LINES.ERROR, TEST_LINES.INFO]

      mockStringDecoder.write.mockReturnValue(TEST_DATA.MULTI_LINE_TEXT)
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_LINES.ERROR)
      expect(mockSplitStream.writeRight).toHaveBeenCalledWith(TEST_LINES.INFO)
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
      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_LINES.ERROR)
      expect(mockSplitStream.writeRight).toHaveBeenCalledWith(TEST_LINES.INFO)
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
      const newFilter = new FilterPrefixedContent(ERROR_PREFIX, mockFilteredStream)

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

  describe('writeLine', () => {
    it('routes matching lines to filtered stream', async () => {
      await (filter as any).writeLine(TEST_LINES.ERROR)

      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_LINES.ERROR)
      expect(mockSplitStream.writeRight).not.toHaveBeenCalled()
    })

    it('routes non-matching lines to main stream', async () => {
      await (filter as any).writeLine(TEST_LINES.INFO)

      expect(mockSplitStream.writeRight).toHaveBeenCalledWith(TEST_LINES.INFO)
      expect(mockSplitStream.writeLeft).not.toHaveBeenCalled()
    })

    it('handles complex regex patterns', async () => {
      const complexFilter = new FilterPrefixedContent(COMPLEX_PREFIX, mockFilteredStream)

      await (complexFilter as any).writeLine(TEST_LINES.ERROR)
      await (complexFilter as any).writeLine(TEST_LINES.WARN)
      await (complexFilter as any).writeLine(TEST_LINES.INFO)

      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_LINES.ERROR)
      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_LINES.WARN)
      expect(mockSplitStream.writeRight).toHaveBeenCalledWith(TEST_LINES.INFO)
    })

    it('handles empty lines', async () => {
      await (filter as any).writeLine(TEST_LINES.EMPTY)

      expect(mockSplitStream.writeRight).toHaveBeenCalledWith(TEST_LINES.EMPTY)
      expect(mockSplitStream.writeLeft).not.toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    it('handles mixed content with multiple lines', async () => {
      const chunk = TEST_CHUNKS.COMPLEX
      const next = vi.fn()
      const lines = [
        TEST_LINES.ERROR.replace('test error', 'First error'),
        TEST_LINES.INFO.replace('test info', 'First info'),
        TEST_LINES.ERROR.replace('test error', 'Second error'),
        TEST_LINES.INFO.replace('test info', 'Second info'),
      ]

      mockStringDecoder.write.mockReturnValue(chunk.toString())
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      await filter.transform(chunk, ENCODING_UTF8, next)

      expect(mockSplitStream.writeLeft).toHaveBeenCalledTimes(2)
      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_LINES.ERROR.replace('test error', 'First error'))
      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_LINES.ERROR.replace('test error', 'Second error'))

      expect(mockSplitStream.writeRight).toHaveBeenCalledTimes(2)
      expect(mockSplitStream.writeRight).toHaveBeenCalledWith(TEST_LINES.INFO.replace('test info', 'First info'))
      expect(mockSplitStream.writeRight).toHaveBeenCalledWith(TEST_LINES.INFO.replace('test info', 'Second info'))
    })

    it('handles partial lines across multiple chunks', async () => {
      const chunk1 = TEST_CHUNKS.PARTIAL_1
      const chunk2 = TEST_CHUNKS.PARTIAL_2
      const next = vi.fn()

      mockStringDecoder.write
      .mockReturnValueOnce(TEST_DATA.PARTIAL_TEXT_1)
      .mockReturnValueOnce(TEST_DATA.PARTIAL_TEXT_2)

      mockLineDecoder[Symbol.iterator]
      .mockReturnValueOnce([][Symbol.iterator]()) // First chunk has no complete lines
      .mockReturnValueOnce([TEST_DATA.COMPLETE_PARTIAL][Symbol.iterator]()) // Second chunk completes the line

      await filter.transform(chunk1, ENCODING_UTF8, next)
      await filter.transform(chunk2, ENCODING_UTF8, next)

      expect(mockSplitStream.writeLeft).toHaveBeenCalledWith(TEST_DATA.COMPLETE_PARTIAL)
    })
  })
})
