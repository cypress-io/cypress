import { describe, it, expect } from 'vitest'
import { addNewlineAtEveryNChar } from '../../../lib/util/newlines'

describe('lib/util/newlines', () => {
  describe('regular strings', () => {
    it('inserts newline at each n char', () => {
      expect(addNewlineAtEveryNChar('123456789', 3)).toBe('123\n456\n789')
    })

    it('does not insert newline if str length <= n', () => {
      expect(addNewlineAtEveryNChar('123', 3)).toBe('123')
    })

    it('returns undefined if str not defined', () => {
      expect(addNewlineAtEveryNChar(undefined, 3)).toBe(undefined)
    })
  })

  describe('strings with ANSI codes', () => {
    it('returns str unchanged if ANSI stripped length <= n', () => {
      const shortAnsiString = '\u001B[31m123\u001B[39m' // "123" in red

      expect(addNewlineAtEveryNChar(shortAnsiString, 3)).toBe(shortAnsiString)
    })

    it('returns str with ANSI stripped if printing length > n', () => {
      const longAnsiString = '\u001B[31m123456789\u001B[39m' // "123456789" in red

      expect(addNewlineAtEveryNChar(longAnsiString, 3)).toBe('123\n456\n789')
    })
  })
})
