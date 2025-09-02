import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { filter } from '../Filter'
import { FilterPrefixedContent } from '../FilterPrefixedContent'
import { FilterTaggedContent } from '../FilterTaggedContent'
import { WriteToDebug } from '../WriteToDebug'
import { START_TAG, END_TAG, DEBUG_PREFIX } from '../constants'

// Mock all dependencies
vi.mock('../FilterPrefixedContent')
vi.mock('../FilterTaggedContent')
vi.mock('../WriteToDebug')

// Mock process.env
const originalEnv = process.env

describe('Filter', () => {
  let mockStderr: any
  let mockDebug: any
  let mockFilterPrefixedContent: any
  let mockFilterTaggedContent: any
  let mockWriteToDebug: any

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }

    // Create mock objects
    mockStderr = {
      write: vi.fn(),
    }

    mockDebug = vi.fn()

    // Mock FilterPrefixedContent
    mockFilterPrefixedContent = {
      pipe: vi.fn().mockImplementation((stream) => stream),
    }

    // Mock FilterTaggedContent
    mockFilterTaggedContent = {
      pipe: vi.fn().mockImplementation((stream) => stream),
    }

    // Mock WriteToDebug
    mockWriteToDebug = {
      pipe: vi.fn().mockImplementation((stream) => stream),
    }

    // Setup mocks
    vi.mocked(FilterPrefixedContent).mockImplementation(() => mockFilterPrefixedContent)
    vi.mocked(FilterTaggedContent).mockImplementation(() => mockFilterTaggedContent)
    vi.mocked(WriteToDebug).mockImplementation(() => mockWriteToDebug)
  })

  afterEach(() => {
    vi.clearAllMocks()
    process.env = originalEnv
  })

  describe('when disableTags is false', () => {
    beforeEach(() => {
      process.env.ELECTRON_ENABLE_LOGGING = '0'
    })

    it('pipes prefixTx -> tagTx -> debugWriter', () => {
      const result = filter(mockStderr, mockDebug, DEBUG_PREFIX, false)

      // Verify FilterPrefixedContent was created with correct args
      expect(FilterPrefixedContent).toHaveBeenCalledWith(DEBUG_PREFIX, mockStderr)

      // Verify FilterTaggedContent was created with correct args
      expect(FilterTaggedContent).toHaveBeenCalledWith(START_TAG, END_TAG, mockStderr)

      // Verify WriteToDebug was created with correct args
      expect(WriteToDebug).toHaveBeenCalledWith(mockDebug)

      // Verify the pipe chain: prefixTx -> tagTx -> debugWriter
      expect(mockFilterPrefixedContent.pipe).toHaveBeenCalledWith(mockFilterTaggedContent)
      expect(mockFilterTaggedContent.pipe).toHaveBeenCalledWith(mockWriteToDebug)

      // Verify the result is the prefixTx
      expect(result).toBe(mockFilterPrefixedContent)
    })
  })

  describe('when disableTags parameter is true', () => {
    beforeEach(() => {
      process.env.ELECTRON_ENABLE_LOGGING = '0'
    })

    it('should pipe prefixTx -> debugWriter (skip tagTx)', () => {
      const result = filter(mockStderr, mockDebug, DEBUG_PREFIX, true)

      // Verify FilterPrefixedContent was created with correct args
      expect(FilterPrefixedContent).toHaveBeenCalledWith(DEBUG_PREFIX, mockStderr)

      // Verify FilterTaggedContent was created with correct args
      expect(FilterTaggedContent).toHaveBeenCalledWith(START_TAG, END_TAG, mockStderr)

      // Verify WriteToDebug was created with correct args
      expect(WriteToDebug).toHaveBeenCalledWith(mockDebug)

      // Verify the pipe chain: prefixTx -> debugWriter (skip tagTx)
      expect(mockFilterPrefixedContent.pipe).toHaveBeenCalledWith(mockWriteToDebug)
      expect(mockFilterTaggedContent.pipe).not.toHaveBeenCalled()

      // Verify the result is the prefixTx
      expect(result).toBe(mockFilterPrefixedContent)
    })
  })
})
