import { describe, it, expect } from 'vitest'
import { splitStack, stackLineRegex } from '../src/stackUtils'

describe('src/stackUtils', () => {
  describe('stackLineRegex', () => {
    it.each([
      '    at foo (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:10:5)',
      '    at http://localhost:3000/__cypress/runner/cypress_runner.js:1:2',
      '    at Context.eval (webpack:///./cypress/e2e/spec.cy.js:3:9)',
      'foo@http://localhost:3000/spec.js:1:2',
      '@http://localhost:3000/spec.js:1:2',
      '    at [native code]',
      '    at foo (<unknown>)',
    ])('matches stack frame %j', (line) => {
      expect(stackLineRegex.test(line)).toBe(true)
    })

    it.each([
      'AssertionError: expected <body> to contain text \'Noted.\'',
      'Error: boom',
      '  From Your Spec Code:',
      '',
    ])('does not match non-frame %j', (line) => {
      expect(stackLineRegex.test(line)).toBe(false)
    })
  })

  describe('splitStack', () => {
    // https://github.com/cypress-io/cypress/issues/35335
    it('splits a stack whose message has a very long line in linear time', () => {
      const message = `AssertionError: Timed out retrying after 4000ms: expected '${'word '.repeat(90000)}' to include 'Noted.'`
      const frame = '    at Context.eval (webpack:///./cypress/e2e/spec.cy.js:3:9)'

      const start = performance.now()
      const [messageLines, stackLines] = splitStack(`${message}\n${frame}`)
      const elapsed = performance.now() - start

      expect(messageLines).toEqual([message])
      expect(stackLines).toEqual([frame])
      // Far above what a linear match needs and far below what a quadratic one
      // needs on this input, so machine load can't flip the result.
      expect(elapsed).toBeLessThan(1000)
    })
  })
})
