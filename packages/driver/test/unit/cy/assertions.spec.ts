/**
 * @vitest-environment jsdom
 */
import sinon from 'sinon'
import { describe, it, expect, vi } from 'vitest'
import type { ICypress } from '../../../src/cypress'
import type { $Cy } from '../../../src/cypress/cy'
import { create, stripStackTraceLines } from '../../../src/cy/assertions'

const assertAndGetLoggedMessage = (message: string, value: unknown) => {
  const log = vi.fn()
  // Safe because assert only reads Cypress.log and cy.state
  const assertions = create({ log } as unknown as ICypress, { state: () => undefined } as unknown as $Cy)

  assertions.assert(true, message, value, undefined, undefined, undefined)

  return log.mock.calls[0][0].message
}

// The message @cypress/sinon-chai builds when `calledWith` fails
const failedCalledWithMessage = (spy, ...expectedArgs) => {
  return spy.printf('expected %n to have been called with arguments %*\n\n    The following calls were made:\n%C', ...expectedArgs)
}

const cartMessage = () => {
  const cart = { addItem (sku: string, quantity: number) {} }
  const spy = sinon.spy(cart, 'addItem')

  cart.addItem('sku-1042', 2)
  cart.addItem('sku-2210', 1)

  return failedCalledWithMessage(spy, 'sku-9999', 3)
}

describe('src/cy/assertions', () => {
  describe('assert', () => {
    const sinonMessage = [
      'expected stub to have been called with arguments **foo**',
      '    at Context.eval (http://localhost:3500/spec.cy.js:10:5)',
      '    at next (http://localhost:3500/runner.js:20:7)',
      '\'bar\'',
    ].join('\n')

    it('removes every stack trace line from a sinon proxy message', () => {
      const message = assertAndGetLoggedMessage(sinonMessage, { isSinonProxy: true })

      expect(message).toBe('expected stub to have been called with arguments **foo**\n   \n   \n\'bar\'')
    })

    it('keeps stack trace lines in a message about any other value', () => {
      expect(assertAndGetLoggedMessage(sinonMessage, {})).toBe(sinonMessage)
    })

    it('keeps a line that only mentions "at" without a leading space', () => {
      const message = 'expected stub to have been called\nat least once\n'

      expect(assertAndGetLoggedMessage(message, { isSinonProxy: true })).toBe(message)
    })
  })

  describe('stripStackTraceLines', () => {
    it('cuts the stack frame from every call but the last', () => {
      const lines = stripStackTraceLines(cartMessage()).split('\n')

      expect(lines.slice(-2)[0]).toEqual('    addItem(sku-1042, 2)')
      expect(lines.slice(-1)[0]).toMatch(/^ {4}addItem\(sku-2210, 1\) at \S/)
    })

    it('cuts the last call too when the message ends in a newline', () => {
      const lines = stripStackTraceLines(`${cartMessage()}\n`).split('\n')

      expect(lines.slice(-3)).toEqual(['    addItem(sku-1042, 2)', '    addItem(sku-2210, 1)', ''])
    })

    // These follow the format rules (a `\r`, `\u2028` or `\u2029` after
    // ` at ` keeps the line) rather than captured output.
    it.each([
      {
        name: '`\\r` after ` at ` keeps the line',
        message: 'expected spy to have been called\r\n    spy() at Context.eval (cart.cy.ts:5:10)\r\nend',
        expected: 'expected spy to have been called\r\n    spy() at Context.eval (cart.cy.ts:5:10)\r\nend',
      },
      {
        name: '` at ` after the last `\\u2028` is cut',
        message: '    addItem(sku-1042) at checkout\u2028    addItem(sku-2210) at checkout (cart.js:4:58)\nend',
        expected: '    addItem(sku-1042) at checkout\u2028    addItem(sku-2210)\nend',
      },
    ])('format rule: $name', ({ message, expected }) => {
      expect(stripStackTraceLines(message)).toEqual(expected)
    })

    it('handles a spy called with a long single line of JSON', () => {
      const beacon = { send (url: string, body: string) {} }
      const spy = sinon.spy(beacon, 'send')
      const events = Array.from({ length: 6_000 }, (_, i) => {
        return {
          type: 'ui',
          message: `Payment form shown at step ${i % 4 + 1} at 10:42:${String(i % 60).padStart(2, '0')}`,
          sessionId: 'c9f1e2a4-7b3d-4e8a-9c61-2f5d8a0b7e13',
        }
      })

      beacon.send('/log', JSON.stringify(events))

      const message = failedCalledWithMessage(spy, '/log', 'flush')

      const start = performance.now()
      const result = stripStackTraceLines(message)

      expect(performance.now() - start).toBeLessThan(1000)
      // The only call is on the last line, which is kept whole
      expect(result).toEqual(message)
    })
  })
})
