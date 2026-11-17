/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import type { ICypress } from '../../../src/cypress'
import type { $Cy } from '../../../src/cypress/cy'
import { create } from '../../../src/cy/assertions'

const assertAndGetLoggedMessage = (message: string, value: unknown) => {
  const log = vi.fn()
  // Safe because assert only reads Cypress.log and cy.state
  const assertions = create({ log } as unknown as ICypress, { state: () => undefined } as unknown as $Cy)

  assertions.assert(true, message, value, undefined, undefined, undefined)

  return log.mock.calls[0][0].message
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
})
