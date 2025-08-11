/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, MockedObject } from 'vitest'
import { go, reload } from '../../../../src/cy/commands/navigation'
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
