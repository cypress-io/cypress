import { describe, it, expect } from 'vitest'
import { DEBUG_PREFIX } from '../constants'

describe('constants', () => {
  describe('DEBUG_PREFIX', () => {
    it('matches an uncolored debug line', () => {
      expect(DEBUG_PREFIX.test('  cypress:server:project hello world +0ms')).toBe(true)
    })

    it('matches a debug line wrapped in ANSI color codes', () => {
      expect(DEBUG_PREFIX.test('  \u001b[34;1mcypress:server:project \u001b[0mhello world \u001b[34m+0ms\u001b[0m')).toBe(true)
    })

    it('matches a namespace without a nested segment', () => {
      expect(DEBUG_PREFIX.test('  \u001b[34;1mcypress:server \u001b[0mhello')).toBe(true)
    })

    it('does not match a line without leading whitespace', () => {
      expect(DEBUG_PREFIX.test('cypress:server:project hello world')).toBe(false)
    })

    it('does not match an indented line without a colon', () => {
      expect(DEBUG_PREFIX.test('  hello world')).toBe(false)
    })

    it('does not match an indented line whose colon follows a space', () => {
      expect(DEBUG_PREFIX.test('  hello : world')).toBe(false)
    })

    it('does not match a stack trace frame', () => {
      expect(DEBUG_PREFIX.test('    at Object.<anonymous> (/app/index.js:10:5)')).toBe(false)
    })

    it('does not match an unindented error message', () => {
      expect(DEBUG_PREFIX.test('Error: something went wrong')).toBe(false)
    })

    it('gives the same answer on repeated calls', () => {
      const line = '  cypress:server:project hello'

      expect([DEBUG_PREFIX.test(line), DEBUG_PREFIX.test(line), DEBUG_PREFIX.test(line)]).toEqual([true, true, true])
    })
  })
})
