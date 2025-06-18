/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, MockedObject } from 'vitest'
import { getTitleQueryCommand } from '../../../../src/cy/commands/window'
import { getTitleFromAutomation } from '../../../../src/cy/commands/helpers/window'
import type { StateFunc } from '../../../../src/cypress/state'
import type { $Cy } from '../../../../src/cypress/cy'

vi.mock('../../../../src/cy/commands/helpers/window', async () => {
  return {
    getTitleFromAutomation: vi.fn(),
  }
})

describe('cy/commands/window', () => {
  let mockCypress: MockedObject<Cypress.Cypress>
  let mockState: MockedObject<StateFunc>
  let mockContext: MockedObject<any>
  let mockCy: MockedObject<$Cy>

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

    // @ts-expect-error
    mockCy = {}

    // @ts-expect-error
    mockState = vi.fn()

    mockContext = {
      set: vi.fn(),
    }

    //@ts-expect-error
    getTitleFromAutomation.mockReset()
  })

  describe('title', () => {
    describe('chromium/firefox', () => {
      it('returns the title from the automation client', () => {
        // @ts-expect-error
        getTitleFromAutomation.mockReturnValue(() => 'This is the frame title')

        const title = getTitleQueryCommand.call(mockContext, mockCypress, mockCy, mockState, {})()

        expect(title).toBe('This is the frame title')

        expect(getTitleFromAutomation).toHaveBeenCalledOnce()

        expect(mockState).not.toHaveBeenCalled()
      })
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
        // @ts-expect-error
        mockState.mockImplementation((key) => {
          if (key === 'document') {
            return { title: 'This is the frame title' }
          }
        })

        const title = getTitleQueryCommand.call(mockContext, mockCypress, mockCy, mockState, {
          timeout: 10000,
        })()

        expect(title).toBe('This is the frame title')

        // @ts-expect-error
        expect(mockCypress.ensure.commandCanCommunicateWithAUT).toHaveBeenCalledOnce()

        expect(mockContext.set).toHaveBeenCalledWith('timeout', 10000)

        expect(getTitleFromAutomation).not.toHaveBeenCalled()

        expect(mockState).toHaveBeenCalledWith('document')
      })
    })
  })
})
