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

describe('Filter', () => {
  let mockStderr: any
  let mockDebug: any
  let mockFilterPrefixedContent: any
  let mockFilterTaggedContent: any
  let mockWriteToDebug: any

  beforeEach(() => {
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
    vi.unstubAllEnvs()
  })

  describe('when tags are enabled', () => {
    it('pipes prefixTx -> tagTx -> debugWriter', () => {
      vi.stubEnv('ELECTRON_ENABLE_LOGGING', '0')
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')

      const result = filter(mockStderr, mockDebug, DEBUG_PREFIX)

      expect(FilterPrefixedContent).toHaveBeenCalledWith(DEBUG_PREFIX, mockStderr)

      expect(FilterTaggedContent).toHaveBeenCalledWith(START_TAG, END_TAG, mockStderr)

      expect(WriteToDebug).toHaveBeenCalledWith(mockDebug)

      expect(mockFilterPrefixedContent.pipe).toHaveBeenCalledWith(mockFilterTaggedContent)
      expect(mockFilterTaggedContent.pipe).toHaveBeenCalledWith(mockWriteToDebug)

      expect(result).toBe(mockFilterPrefixedContent)
    })
  })

  describe('disabling tags', () => {
    function expectNoTags () {
      const result = filter(mockStderr, mockDebug, DEBUG_PREFIX)

      // Verify FilterPrefixedContent was created with correct args
      expect(FilterPrefixedContent).toHaveBeenCalledWith(DEBUG_PREFIX, mockStderr)

      // Verify FilterTaggedContent was created with correct args
      expect(FilterTaggedContent).not.toHaveBeenCalled()

      // Verify WriteToDebug was created with correct args
      expect(WriteToDebug).toHaveBeenCalledWith(mockDebug)

      // Verify the pipe chain: prefixTx -> debugWriter (skip tagTx)
      expect(mockFilterPrefixedContent.pipe).toHaveBeenCalledWith(mockWriteToDebug)
      expect(mockFilterTaggedContent.pipe).not.toHaveBeenCalled()

      // Verify the result is the prefixTx
      expect(result).toBe(mockFilterPrefixedContent)
    }

    it('does not add tags when ELECTRON_ENABLE_LOGGING is enabled', () => {
      vi.stubEnv('ELECTRON_ENABLE_LOGGING', '1')
      expectNoTags()
    })

    it('does not add tags when CYPRESS_INTERNAL_ENV is development', () => {
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'development')
      expectNoTags()
    })
  })
})
