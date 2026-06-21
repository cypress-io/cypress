/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, MockedObject } from 'vitest'
import { getTitleQueryCommand } from '../../../../src/cy/commands/window'
import { getTitleFromAutomation } from '../../../../src/cy/commands/helpers/window'

vi.mock('../../../../src/cy/commands/helpers/window', async () => {
  return {
    getTitleFromAutomation: vi.fn(),
  }
})

describe('cy/commands/window', () => {
  let mockCypress: MockedObject<Cypress.Cypress>
  let mockContext: MockedObject<any>

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

    mockContext = {
      set: vi.fn(),
    }

    //@ts-expect-error
    getTitleFromAutomation.mockReset()
  })

  describe('title', () => {
    it('returns the title from the automation client', () => {
      // @ts-expect-error
      getTitleFromAutomation.mockReturnValue(() => 'This is the frame title')

      const title = getTitleQueryCommand.call(mockContext, mockCypress, {})()

      expect(title).toBe('This is the frame title')

      expect(getTitleFromAutomation).toHaveBeenCalledOnce()
    })

    it('uses the automation client for webkit', () => {
      mockCypress.isBrowser.mockImplementation((browserName) => browserName === 'webkit')

      // @ts-expect-error
      getTitleFromAutomation.mockReturnValue(() => 'This is the frame title')

      const title = getTitleQueryCommand.call(mockContext, mockCypress, {})()

      expect(title).toBe('This is the frame title')

      expect(getTitleFromAutomation).toHaveBeenCalledOnce()
    })
  })
})
