/**
 * @vitest-environment jsdom
 */
import type { MockedObject } from 'vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { go, reload, resetServerState } from '../../../../src/cy/commands/navigation'
import $utils from '../../../../src/cypress/utils'
import type{ $Cy } from '../../../../src/cypress/cy'

vi.mock('../../../../src/cypress/utils', async () => {
  const original = await vi.importActual('../../../../src/cypress/utils')

  return {
    default: {
      // @ts-expect-error - importOriginal() returns unknown
      ...original.default,
      locReload: vi.fn(),
    },
  }
})

describe('cy/commands/navigation', () => {
  let mockCypress: MockedObject<Cypress.Cypress>
  let mockCy: MockedObject<$Cy>
  let mockContext: MockedObject<any>
  let mockState: MockedObject<any>

  beforeEach(() => {
    mockCypress = {
      // @ts-expect-error - vi.fn() can't reproduce the overloads of Cypress.log
      log: vi.fn(),
      automation: vi.fn(),
      isBrowser: vi.fn(),
      // @ts-expect-error - vi.fn() can't reproduce the overloads of Cypress.backend
      backend: vi.fn(),
      isCrossOriginSpecBridge: false,
      ensure: {
        // @ts-expect-error - the public Cypress.Ensure type omits the internal `commandCanCommunicateWithAUT`
        commandCanCommunicateWithAUT: vi.fn(),
      },
      // @ts-expect-error - vi.fn() does not match the overloads of Cypress.config
      config: vi.fn(),
    }

    mockCy = {
      clearTimeout: vi.fn(),
      // @ts-expect-error - vi.fn() returns a $Cy, not the mocked $Cy
      once: vi.fn(),
      // @ts-expect-error - vi.fn() returns a $Cy, not the mocked $Cy
      removeListener: vi.fn(),
    }

    mockState = vi.fn()

    mockContext = {
      set: vi.fn(),
    }

    mockCypress.config.mockImplementation((key) => {
      // @ts-expect-error - the mocked config() overloads type `key` as TestConfigOverrides
      if (key === 'pageLoadTimeout') {
        return 10000
      }

      return undefined
    })

    // @ts-expect-error - $utils.locReload is a vi.mock, but typed as the real function
    $utils.locReload.mockReset()
  })

  describe('reload', () => {
    describe('chromium/firefox', () => {
      it('sends the reload:aut:frame event to the backend via the automation client', () => {
        reload.call(mockContext, mockCypress, mockCy, mockState, mockCypress.config, [true])

        expect(mockCypress.automation).toHaveBeenCalledWith('reload:aut:frame', {
          forceReload: true,
        })

        expect(mockCypress.log).toHaveBeenCalledWith({
          hidden: false,
          timeout: 10000,
        })

        expect($utils.locReload).not.toHaveBeenCalled()
      })

      describe('webkit', () => {
        beforeEach(() => {
          mockCypress.isBrowser.mockImplementation((browserName) => {
            if (browserName === 'webkit') {
              return true
            }

            return false
          })
        })

        it('does not use the automation client if the browser is webkit', () => {
          let mockWindow = {}

          mockState.mockImplementation((key) => {
            if (key === 'window') {
              return mockWindow
            }

            return undefined
          })

          reload.call(mockContext, mockCypress, mockCy, mockState, mockCypress.config, [true])

          expect(mockCypress.log).toHaveBeenCalledWith({
            hidden: false,
            timeout: 10000,
          })

          expect(mockCypress.automation).not.toHaveBeenCalled()

          expect(mockCypress.log).toHaveBeenCalledWith({
            hidden: false,
            timeout: 10000,
          })

          expect($utils.locReload).toHaveBeenCalledWith(true, mockWindow)
        })
      })
    })
  })

  describe('resetServerState', () => {
    beforeEach(() => {
      mockCypress.config.mockImplementation((key) => {
        // @ts-expect-error - the mocked config() overloads type `key` as TestConfigOverrides
        if (key === 'blockHosts') {
          return ['*.foo.com']
        }

        return undefined
      })
    })

    it('resets the redirection count for the upcoming test', () => {
      resetServerState(mockCypress, mockState)

      expect(mockState).toHaveBeenCalledWith('redirectionCount', {})
    })

    it('sends the resolved blockHosts so the server picks up test config overrides', () => {
      resetServerState(mockCypress, mockState)

      expect(mockCypress.backend).toHaveBeenCalledWith('reset:server:state', { blockHosts: ['*.foo.com'] })
    })

    it('sends null when blockHosts is unset so an override can be cleared', () => {
      mockCypress.config.mockImplementation(() => undefined)

      resetServerState(mockCypress, mockState)

      expect(mockCypress.backend).toHaveBeenCalledWith('reset:server:state', { blockHosts: null })
    })

    it('omits blockHosts from a cross-origin spec bridge', () => {
      mockCypress.isCrossOriginSpecBridge = true

      resetServerState(mockCypress, mockState)

      expect(mockCypress.backend).toHaveBeenCalledWith('reset:server:state', {})
    })
  })

  describe('go', () => {
    let mockWindow

    beforeEach(() => {
      mockWindow = {
        history: {
          go: vi.fn(),
        },
      }

      mockState.mockImplementation((key) => {
        if (key === 'window') {
          return mockWindow
        }
      })
    })

    describe('chromium/firefox', () => {
      it('sends the navigate:aut:history event to the backend via the automation client', () => {
        go.call(mockContext, mockCypress, mockCy, mockState, mockCypress.config, -1, {})

        expect(mockCypress.automation).toHaveBeenCalledWith('navigate:aut:history', {
          historyNumber: -1,
        })

        expect(mockCypress.log).toHaveBeenCalledWith({
          hidden: false,
          timeout: 10000,
        })

        expect(mockWindow.history.go).not.toHaveBeenCalled()
      })

      describe('webkit', () => {
        beforeEach(() => {
          mockCypress.isBrowser.mockImplementation((browserName) => {
            if (browserName === 'webkit') {
              return true
            }

            return false
          })
        })

        it('does not use the automation client if the browser is webkit', () => {
          go.call(mockContext, mockCypress, mockCy, mockState, mockCypress.config, -1, {})

          expect(mockCypress.log).toHaveBeenCalledWith({
            hidden: false,
            timeout: 10000,
          })

          expect(mockCypress.automation).not.toHaveBeenCalled()

          expect(mockWindow.history.go).toHaveBeenCalledWith(-1)
        })
      })
    })
  })
})
