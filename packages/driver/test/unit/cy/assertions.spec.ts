/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { stripStackTraceLines } from '../../../src/cy/assertions'

describe('cy/assertions', () => {
  describe('stripStackTraceLines', () => {
    // Captured from sinon 8.1.1: spy.printf('expected %n to have been called with arguments %*%C', 'sku-9999', 3)
    const sinonMessage = 'expected addItem to have been called with arguments sku-9999, 3\n    addItem(sku-1042, 2) at checkout (/tmp/claude-0/sinon-msg2.js:4:29)\n    addItem(sku-2210, 1) at checkout (/tmp/claude-0/sinon-msg2.js:4:58)'

    it.each([
      {
        name: 'sinon call list, the last line is kept whole',
        message: sinonMessage,
        expected: 'expected addItem to have been called with arguments sku-9999, 3\n    addItem(sku-1042, 2)\n    addItem(sku-2210, 1) at checkout (/tmp/claude-0/sinon-msg2.js:4:58)',
      },
      {
        name: 'sinon call list followed by a newline',
        message: `${sinonMessage}\n`,
        expected: 'expected addItem to have been called with arguments sku-9999, 3\n    addItem(sku-1042, 2)\n    addItem(sku-2210, 1)\n',
      },
      {
        name: 'single line',
        message: 'expected addItem to have been called once',
        expected: 'expected addItem to have been called once',
      },
      {
        name: 'empty message',
        message: '',
        expected: '',
      },
      {
        name: 'blank lines',
        message: '\n\n',
        expected: '\n\n',
      },
      // The cases below follow the format rules (a `\r`, `\u2028` or `\u2029`
      // after ` at ` keeps the line) rather than captured output.
      {
        name: 'format rule: cuts at the first ` at ` on a line',
        message: '    addItem(meet at noon) at checkout (cart.js:4:29)\nend',
        expected: '    addItem(meet\nend',
      },
      {
        name: 'format rule: `\\r` after ` at ` keeps the line',
        message: 'expected spy to have been called\r\n    spy() at Context.eval (cart.cy.ts:5:10)\r\nend',
        expected: 'expected spy to have been called\r\n    spy() at Context.eval (cart.cy.ts:5:10)\r\nend',
      },
      {
        name: 'format rule: ` at ` after the last `\\u2028` is cut',
        message: '    addItem(sku-1042) at checkout\u2028    addItem(sku-2210) at checkout (cart.js:4:58)\nend',
        expected: '    addItem(sku-1042) at checkout\u2028    addItem(sku-2210)\nend',
      },
    ])('$name', ({ message, expected }) => {
      expect(stripStackTraceLines(message)).toEqual(expected)
    })

    it('handles a 50,000-character line of repeated ` at `', () => {
      const repeated = ' at '.repeat(12_500)
      const message = `${repeated}\r at \n`

      const start = performance.now()
      const result = stripStackTraceLines(message)

      expect(performance.now() - start).toBeLessThan(200)
      expect(result).toEqual(`${repeated}\r\n`)
    })
  })
})
