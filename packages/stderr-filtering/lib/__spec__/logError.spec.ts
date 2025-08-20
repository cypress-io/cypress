import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logError } from '../logError'
import { START_TAG, END_TAG } from '../constants'

describe('logError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Mock console.error at the module boundary
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore the original console.error
    consoleErrorSpy.mockRestore()
  })

  describe('START_TAG and END_TAG constants', () => {
    it('exports unique and identifiable tags', () => {
      expect(START_TAG).not.toBe(END_TAG)
    })
  })

  describe('logError function', () => {
    it('calls console.error with start tag, arguments, and end tag', () => {
      const errorMessage = 'Something went wrong'
      const errorObject = new Error('Test error')

      logError(errorMessage, errorObject)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(START_TAG, errorMessage, errorObject, END_TAG)
    })

    it('handles single string argument', () => {
      const message = 'Single error message'

      logError(message)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(START_TAG, message, END_TAG)
    })

    it('handles multiple arguments', () => {
      const message = 'Error occurred'
      const code = 500
      const details = { userId: 123, action: 'login' }

      logError(message, code, details)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(START_TAG, message, code, details, END_TAG)
    })

    it('handles no arguments', () => {
      logError()

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(START_TAG, END_TAG)
    })

    it('handles various argument types', () => {
      const stringArg = 'string message'
      const numberArg = 42
      const booleanArg = true
      const nullArg = null
      const undefinedArg = undefined
      const objectArg = { key: 'value' }
      const arrayArg = [1, 2, 3]

      logError(stringArg, numberArg, booleanArg, nullArg, undefinedArg, objectArg, arrayArg)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        START_TAG,
        stringArg,
        numberArg,
        booleanArg,
        nullArg,
        undefinedArg,
        objectArg,
        arrayArg,
        END_TAG,
      )
    })

    it('preserves the order of arguments', () => {
      const first = 'first'
      const second = 'second'
      const third = 'third'

      logError(first, second, third)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(START_TAG, first, second, third, END_TAG)
    })

    it('handles Error objects correctly', () => {
      const error = new Error('Test error message')

      error.stack = 'Error: Test error message\n    at test.js:1:1'

      logError(error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(START_TAG, error, END_TAG)
    })
  })

  describe('integration with console.error', () => {
    it('calls console.error exactly once per logError call', () => {
      logError('First error')
      logError('Second error')
      logError('Third error')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3)
    })

    it('passes through all arguments to console.error', () => {
      const complexObject = {
        message: 'Complex error',
        timestamp: new Date(),
        metadata: {
          userId: 123,
          sessionId: 'abc-123',
        },
      }

      logError('Error occurred:', complexObject)

      expect(consoleErrorSpy).toHaveBeenCalledWith(START_TAG, 'Error occurred:', complexObject, END_TAG)
    })
  })
})
