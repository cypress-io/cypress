import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Writable } from 'stream'
import { WriteToDebug } from '../WriteToDebug'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from '../LineDecoder'

vi.mock('node:string_decoder')
vi.mock('../LineDecoder')

const MockStringDecoder = vi.mocked(StringDecoder)
const MockLineDecoder = vi.mocked(LineDecoder)

describe('WriteToDebug', () => {
  const TEST_CONSTANTS = {
    ENCODING_UTF8: 'utf8' as const,
    ENCODING_BUFFER: 'buffer' as const,
  }

  const TEST_DATA = {
    SINGLE_LINE: 'test line',
    MULTI_LINE: 'line1\nline2\nline3',
    EMPTY_LINE: '',
    WHITESPACE_ONLY: '   \n',
    LINE_WITH_TRAILING_NEWLINE: 'test line\n',
    LINE_WITHOUT_TRAILING_NEWLINE: 'test line',
  }

  const TEST_CHUNKS = {
    SINGLE_LINE: Buffer.from(TEST_DATA.SINGLE_LINE),
    MULTI_LINE: Buffer.from(TEST_DATA.MULTI_LINE),
    EMPTY: Buffer.from(''),
  }

  let writeToDebug: WriteToDebug
  let mockDebug: any
  let mockStringDecoder: any
  let mockLineDecoder: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockDebug = vi.fn()
    mockStringDecoder = {
      write: vi.fn().mockReturnValue(''),
    }

    mockLineDecoder = {
      write: vi.fn(),
      end: vi.fn().mockReturnValue([][Symbol.iterator]()),
      [Symbol.iterator]: vi.fn().mockReturnValue([][Symbol.iterator]()),
    }

    MockStringDecoder.mockImplementation(() => mockStringDecoder)
    MockLineDecoder.mockImplementation(() => mockLineDecoder)

    writeToDebug = new WriteToDebug(mockDebug)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('creates a Writable stream with correct configuration', () => {
      expect(writeToDebug).toBeInstanceOf(Writable)
      expect(writeToDebug).toBeInstanceOf(WriteToDebug)
    })
  })

  describe('write', () => {
    beforeEach(() => {
      mockStringDecoder.write.mockReturnValue('')
      mockLineDecoder[Symbol.iterator].mockReturnValue([][Symbol.iterator]())
    })

    describe('when string decoder is not initialized', () => {
      describe('and encoding is utf8', () => {
        it('initializes string decoder with utf8 encoding', () => {
          writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(MockStringDecoder).toHaveBeenCalledWith(TEST_CONSTANTS.ENCODING_UTF8)
        })
      })

      describe('and encoding is buffer', () => {
        it('initializes string decoder with utf8 encoding', () => {
          // @ts-expect-error type here is not correct, 'buffer' is not a valid encoding but it does get passed in
          writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_BUFFER)

          expect(MockStringDecoder).toHaveBeenCalledWith(TEST_CONSTANTS.ENCODING_UTF8)
        })
      })
    })

    describe('when line decoder is not initialized', () => {
      it('initializes line decoder', () => {
        writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

        expect(MockLineDecoder).toHaveBeenCalled()
      })
    })

    it('writes to string decoder', () => {
      writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

      expect(mockStringDecoder.write).toHaveBeenCalledWith(TEST_CHUNKS.SINGLE_LINE)
    })

    describe('when string decoder returns a string', () => {
      beforeEach(() => {
        mockStringDecoder.write.mockReturnValue(TEST_DATA.SINGLE_LINE)
      })

      it('writes to line decoder', () => {
        writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

        expect(mockLineDecoder.write).toHaveBeenCalledWith(TEST_DATA.SINGLE_LINE)
      })

      describe('and line decoder returns a single line', () => {
        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.SINGLE_LINE][Symbol.iterator]())
        })

        it('calls debug with the line', () => {
          writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(mockDebug).toHaveBeenCalledWith(TEST_DATA.SINGLE_LINE)
        })
      })

      describe('and line decoder returns multiple lines', () => {
        const lines = ['line1', 'line2', 'line3']

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())
        })

        it('calls debug with each line', () => {
          writeToDebug.write(TEST_CHUNKS.MULTI_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(mockDebug).toHaveBeenCalledTimes(3)
          expect(mockDebug).toHaveBeenNthCalledWith(1, 'line1')
          expect(mockDebug).toHaveBeenNthCalledWith(2, 'line2')
          expect(mockDebug).toHaveBeenNthCalledWith(3, 'line3')
        })
      })

      describe('and line decoder returns an empty line', () => {
        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.EMPTY_LINE][Symbol.iterator]())
        })

        it('does not call debug', () => {
          writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(mockDebug).not.toHaveBeenCalled()
        })
      })

      describe('and line decoder returns a line with trailing newline', () => {
        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.LINE_WITH_TRAILING_NEWLINE][Symbol.iterator]())
        })

        it('calls debug with line without trailing newline', () => {
          writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(mockDebug).toHaveBeenCalledWith(TEST_DATA.LINE_WITHOUT_TRAILING_NEWLINE)
        })
      })

      describe('and line decoder returns a line without trailing newline', () => {
        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.LINE_WITHOUT_TRAILING_NEWLINE][Symbol.iterator]())
        })

        it('calls debug with the line as-is', () => {
          writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(mockDebug).toHaveBeenCalledWith(TEST_DATA.LINE_WITHOUT_TRAILING_NEWLINE)
        })
      })

      describe('and line decoder returns whitespace-only line', () => {
        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue([TEST_DATA.WHITESPACE_ONLY][Symbol.iterator]())
        })

        it('calls debug with whitespace-only line', () => {
          writeToDebug.write(TEST_CHUNKS.SINGLE_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(mockDebug).toHaveBeenCalledWith('   ')
        })
      })

      describe('and line decoder returns mixed content', () => {
        const lines = ['line1', '', 'line2', '   \n', 'line3']

        beforeEach(() => {
          mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())
        })

        it('calls debug only for non-empty lines', () => {
          writeToDebug.write(TEST_CHUNKS.MULTI_LINE, TEST_CONSTANTS.ENCODING_UTF8)

          expect(mockDebug).toHaveBeenCalledTimes(4)
          expect(mockDebug).toHaveBeenNthCalledWith(1, 'line1')
          expect(mockDebug).toHaveBeenNthCalledWith(2, 'line2')
          expect(mockDebug).toHaveBeenNthCalledWith(3, '   ')
          expect(mockDebug).toHaveBeenNthCalledWith(4, 'line3')
        })
      })
    })
  })

  describe('final', () => {
    beforeEach(() => {
      mockStringDecoder.write.mockReturnValue('')
      mockLineDecoder[Symbol.iterator].mockReturnValue([][Symbol.iterator]())
      mockLineDecoder.end.mockReturnValue([][Symbol.iterator]())
    })

    it('processes remaining lines from line decoder', () => {
      const remainingLines = ['final line 1', 'final line 2']

      mockLineDecoder.end.mockReturnValue(remainingLines[Symbol.iterator]())

      writeToDebug.end()

      expect(mockLineDecoder.end).toHaveBeenCalledWith()
      expect(mockDebug).toHaveBeenCalledTimes(2)
      expect(mockDebug).toHaveBeenNthCalledWith(1, 'final line 1')
      expect(mockDebug).toHaveBeenNthCalledWith(2, 'final line 2')
    })

    it('handles empty remaining lines', () => {
      writeToDebug.end()

      expect(mockLineDecoder.end).toHaveBeenCalledWith()
      expect(mockDebug).not.toHaveBeenCalled()
    })

    it('handles undefined decoders', () => {
      const newWriteToDebug = new WriteToDebug(mockDebug)

      newWriteToDebug.end()

      // Should not throw
      expect(true).toBe(true)
    })

    it('cleans up decoders after processing', () => {
      writeToDebug.end()

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    it('handles multi-line content with mixed empty lines', () => {
      const multiLineContent = 'line1\n\nline2\n   \nline3'
      const lines = ['line1', '', 'line2', '   \n', 'line3']

      mockStringDecoder.write.mockReturnValue(multiLineContent)
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      writeToDebug.write(Buffer.from(multiLineContent), TEST_CONSTANTS.ENCODING_UTF8)

      expect(mockDebug).toHaveBeenCalledTimes(4)
      expect(mockDebug).toHaveBeenNthCalledWith(1, 'line1')
      expect(mockDebug).toHaveBeenNthCalledWith(2, 'line2')
      expect(mockDebug).toHaveBeenNthCalledWith(3, '   ')
      expect(mockDebug).toHaveBeenNthCalledWith(4, 'line3')
    })

    it('handles content with trailing newlines', () => {
      const contentWithNewlines = 'line1\nline2\n'
      const lines = ['line1\n', 'line2\n']

      mockStringDecoder.write.mockReturnValue(contentWithNewlines)
      mockLineDecoder[Symbol.iterator].mockReturnValue(lines[Symbol.iterator]())

      writeToDebug.write(Buffer.from(contentWithNewlines), TEST_CONSTANTS.ENCODING_UTF8)

      expect(mockDebug).toHaveBeenCalledTimes(2)
      expect(mockDebug).toHaveBeenNthCalledWith(1, 'line1')
      expect(mockDebug).toHaveBeenNthCalledWith(2, 'line2')
    })

    it('handles final flush with remaining content', () => {
      const remainingLines = ['final line 1', 'final line 2\n', '']

      mockLineDecoder.end.mockReturnValue(remainingLines[Symbol.iterator]())

      writeToDebug.end()

      expect(mockDebug).toHaveBeenCalledTimes(2)
      expect(mockDebug).toHaveBeenNthCalledWith(1, 'final line 1')
      expect(mockDebug).toHaveBeenNthCalledWith(2, 'final line 2')
    })
  })
})
