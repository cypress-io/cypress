/**
 * @vitest-environment jsdom
 */
import type { MockedObject } from 'vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
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
      // @ts-expect-error - vi.fn() can't reproduce the overloads of Cypress.log
      log: vi.fn(),
      automation: vi.fn(),
      isBrowser: vi.fn(),
      ensure: {
        // @ts-expect-error - the public Cypress.Ensure type omits the internal `commandCanCommunicateWithAUT`
        commandCanCommunicateWithAUT: vi.fn(),
      },
      // @ts-expect-error - vi.fn() does not match the overloads of Cypress.config
      config: vi.fn(),
    }

    mockContext = {
      set: vi.fn(),
    }

    // @ts-expect-error - getTitleFromAutomation is a vi.mock, but typed as the real function
    getTitleFromAutomation.mockReset()
  })

  describe('title', () => {
    it('returns the title from the automation client', () => {
      // @ts-expect-error - getTitleFromAutomation is a vi.mock, but typed as the real function
      getTitleFromAutomation.mockReturnValue(() => 'This is the frame title')

      expect(getTitleQueryCommand.call(mockContext, mockCypress, {})()).toBe('This is the frame title')

      expect(getTitleFromAutomation).toHaveBeenCalledOnce()
    })
  })
})
