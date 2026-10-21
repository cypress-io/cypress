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
    const hint = 'Because `injectDocumentDomain` is disabled (the default), a subdomain of the same domain counts as a different origin.'

    let injectDocumentDomain: boolean
    let autOrigin: string
    let cy

    const setSpecOrigin = (origin: string) => {
      // @ts-expect-error - vitest's jsdom environment exposes the JSDOM instance on window
      window.jsdom.reconfigure({ url: `${origin}/` })
    }

    const getError = (err?: Error) => {
      try {
        ensure.commandCanCommunicateWithAUT(cy, err)
      } catch (thrown) {
        return thrown
      }

      throw new Error('expected commandCanCommunicateWithAUT to throw')
    }

    beforeEach(() => {
      vi.mocked(isRunnerAbleToCommunicateWithAut).mockReturnValue(false)

      injectDocumentDomain = false
      autOrigin = 'http://app.foobar.com:3500'
      setSpecOrigin('http://www.foobar.com:3500')

      // @ts-expect-error
      global.Cypress = {
        config: vi.fn((key) => {
          return key === 'injectDocumentDomain' ? injectDocumentDomain : undefined
        }),
        isBrowser: vi.fn(() => false),
      }

      cy = {
        state: vi.fn(() => ({ origin: autOrigin })),
      }
    })

    it('returns true when the runner can communicate with the AUT', () => {
      vi.mocked(isRunnerAbleToCommunicateWithAut).mockReturnValue(true)

      expect(ensure.commandCanCommunicateWithAUT(cy)).toBe(true)
    })

    it('explains that a subdomain counts as a different origin when injectDocumentDomain is disabled and the origins share a superdomain', () => {
      const err = getError()

      expect(err.message).toContain('The command was expected to run against origin `http://www.foobar.com:3500` but the application is at origin `http://app.foobar.com:3500`.')
      expect(err.message).toContain(`unexpectedly.\n\n${hint}\n\nUse \`cy.origin()\``)
      expect(err.message).toContain('Use `cy.origin()` to wrap the commands run on `http://app.foobar.com:3500`.')
    })

    it('omits the injectDocumentDomain explanation when the origins are on different superdomains', () => {
      setSpecOrigin('http://localhost:3500')
      autOrigin = 'http://www.foobar.com:3500'

      const err = getError()

      expect(err.message).toContain('but the application is at origin `http://www.foobar.com:3500`.')
      expect(err.message).not.toContain('injectDocumentDomain')
      expect(err.message).toContain('unexpectedly.\n\nUse `cy.origin()` to wrap the commands run on `http://www.foobar.com:3500`.')
    })

    it('omits the injectDocumentDomain explanation when injectDocumentDomain is enabled', () => {
      injectDocumentDomain = true

      const err = getError()

      expect(err.message).not.toContain('injectDocumentDomain')
      expect(err.message).toContain('Use `cy.origin()` to wrap the commands run on `http://app.foobar.com:3500`.')
    })

    it('omits the injectDocumentDomain explanation when the application is at an opaque origin', () => {
      autOrigin = 'null'

      const err = getError()

      expect(err.message).toContain('but the application is at origin `null`.')
      expect(err.message).not.toContain('injectDocumentDomain')
    })

    it('appends the cross-origin message to an existing error and rethrows it', () => {
      const original = new Error('expected <div> to be visible')

      const err = getError(original)

      expect(err).toBe(original)
      expect(err.message).toMatch(/^expected <div> to be visible\n\nThe command was expected to run against origin `http:\/\/www\.foobar\.com:3500`/)
      expect(err.message).toContain(hint)
    })
  })
})
