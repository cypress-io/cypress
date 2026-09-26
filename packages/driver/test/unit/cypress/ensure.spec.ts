/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ensure from '../../../src/cypress/ensure'
import { isRunnerAbleToCommunicateWithAut } from '../../../src/util/commandAUTCommunication'

vi.mock('../../../src/util/commandAUTCommunication', () => {
  return {
    isRunnerAbleToCommunicateWithAut: vi.fn(),
  }
})

describe('ensure', () => {
  describe('commandCanCommunicateWithAUT', () => {
    const hint = 'Because `injectDocumentDomain` is disabled (the default), commands that run after the application navigates to a different origin must be wrapped in `cy.origin()`, even when the new origin is a subdomain of the same domain.'

    let injectDocumentDomain: boolean
    let cy

    const getError = () => {
      try {
        ensure.commandCanCommunicateWithAUT(cy)
      } catch (err) {
        return err
      }

      throw new Error('expected commandCanCommunicateWithAUT to throw')
    }

    beforeEach(() => {
      vi.mocked(isRunnerAbleToCommunicateWithAut).mockReturnValue(false)

      // @ts-expect-error
      global.Cypress = {
        config: vi.fn((key) => {
          return key === 'injectDocumentDomain' ? injectDocumentDomain : undefined
        }),
      }

      cy = {
        state: vi.fn(() => ({ origin: 'http://www.foobar.com:3500' })),
      }
    })

    it('returns true when the runner can communicate with the AUT', () => {
      vi.mocked(isRunnerAbleToCommunicateWithAut).mockReturnValue(true)

      expect(ensure.commandCanCommunicateWithAUT(cy)).toBe(true)
    })

    it('explains that cy.origin() is required for any origin change when injectDocumentDomain is disabled', () => {
      injectDocumentDomain = false

      const err = getError()

      expect(err.message).toContain(`but the application is at origin \`http://www.foobar.com:3500\`.`)
      expect(err.message).toContain(hint)
      expect(err.message).toContain('Using `cy.origin()` to wrap the commands run on `http://www.foobar.com:3500` will likely fix this issue.')
    })

    it('omits the injectDocumentDomain explanation when injectDocumentDomain is enabled', () => {
      injectDocumentDomain = true

      const err = getError()

      expect(err.message).toContain(`but the application is at origin \`http://www.foobar.com:3500\`.`)
      expect(err.message).not.toContain('injectDocumentDomain')
      expect(err.message).toContain('Using `cy.origin()` to wrap the commands run on `http://www.foobar.com:3500` will likely fix this issue.')
    })
  })
})
