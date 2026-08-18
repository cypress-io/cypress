/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, MockedObject } from 'vitest'
import { go, reload, resetServerState } from '../../../../src/cy/commands/navigation'
import $utils from '../../../../src/cypress/utils'
import type{ $Cy } from '../../../../src/cypress/cy'

vi.mock('../../../../src/cypress/utils', async () => {
  const original = await vi.importActual('../../../../src/cypress/utils')

  return {
    default: {
      // @ts-expect-error
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
      log: vi.fn(),
      automation: vi.fn(),
      isBrowser: vi.fn(),
      backend: vi.fn(),
      // @ts-expect-error
      isCrossOriginSpecBridge: false,
      ensure: {
        // @ts-expect-error
        commandCanCommunicateWithAUT: vi.fn(),
      },
      // @ts-expect-error
      config: vi.fn(),
    }

    mockCy = {
      clearTimeout: vi.fn(),
      // @ts-expect-error
      once: vi.fn(),
      // @ts-expect-error
      removeListener: vi.fn(),
    }

    mockState = vi.fn()

    mockContext = {
      set: vi.fn(),
    }

    mockCypress.config.mockImplementation((key) => {
      //@ts-expect-error
      if (key === 'pageLoadTimeout') {
        return 10000
      }
    })

    //@ts-expect-error
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
        // @ts-expect-error
        if (key === 'blockHosts') {
          return ['*.foo.com']
        }
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
      // @ts-expect-error
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
      beforeEach(() => {
        mockCypress.automation.mockResolvedValue({ traversed: true })
      })

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

      // https://github.com/cypress-io/cypress/issues/23736
      it('errors when the entry to traverse to belongs to the Cypress runner', async () => {
        mockCypress.automation.mockResolvedValue({ traversed: false })

        await expect(go.call(mockContext, mockCypress, mockCy, mockState, mockCypress.config, -1, {}))
        .rejects.toThrow('could not navigate back because the application under test has no page to go back to')
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
