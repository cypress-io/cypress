import { describe, it, expect } from 'vitest'
import { splitStack, stackLineRegex } from '../src/stackUtils'

describe('src/stackUtils', () => {
  describe('stackLineRegex', () => {
    it.each([
      '    at foo (http://localhost:3000/__cypress/tests?p=cypress/e2e/a.cy.js:12:5)',
      '    at http://localhost:3000/__cypress/runner/cypress_runner.js:1:2',
      'foo@http://localhost:3000/__cypress/runner/cypress_runner.js:1:2',
      '@http://localhost:3000/a.js:10:20',
      '    at <unknown>',
      '    at Array.map ([native code])',
      'map@[native code]',
      'webpack:///./cypress/e2e/a.cy.js:10:20',
    ])('matches stack line %s', (line) => {
      expect(stackLineRegex.test(line)).toBe(true)
    })

    it.each([
      'AssertionError: expected true to be false',
      'Error: boom',
      '    at foo (a.js:1:2) and more text',
      '',
    ])('does not match message line %s', (line) => {
      expect(stackLineRegex.test(line)).toBe(false)
    })

    it('tests a very long message line in linear time', () => {
      const line = `AssertionError: expected <body> to contain text 'Noted.', but the text was '${'word '.repeat(30000)}'`

      const start = performance.now()

      expect(stackLineRegex.test(line)).toBe(false)
      expect(performance.now() - start).toBeLessThan(1000)
    })
  })

  describe('splitStack', () => {
    it('splits a long message from its stack lines', () => {
      const message = `Error: ${'word '.repeat(30000)}`
      const stackLine = '    at foo (http://localhost:3000/a.js:1:2)'

      const [messageLines, stackLines] = splitStack(`${message}\n${stackLine}`)

      expect(messageLines).toEqual([message])
      expect(stackLines).toEqual([stackLine])
    })
  })
})
