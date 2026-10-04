import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import FirefoxUtil from '../../../lib/browsers/firefox-util'
import type { Automation } from '../../../lib/automation'
import type { Client as WebDriverClient } from 'webdriver'
import { BidiAutomation } from '../../../lib/browsers/bidi_automation'

describe('Firefox-Util', () => {
  let automation: { use: Mock }
  let onError: Mock
  let url: string
  let remotePort: number | undefined
  let webdriverClient: Partial<WebDriverClient>
  let useWebDriverBiDi: boolean
  let stubbedBiDiAutomation: {
    automationMiddleware: unknown
    setTopLevelContextId: Mock
  }

  beforeEach(() => {
    automation = { use: vi.fn() }
    onError = vi.fn()
    url = 'http://some-url'
    remotePort = 8000
    webdriverClient = {
      sessionSubscribe: vi.fn().mockResolvedValue(undefined),
      browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [{
        context: 'abc',
        children: [],
        url: 'http://some-url',
        userContext: 'user-context',
      }] }),
      browsingContextNavigate: vi.fn().mockResolvedValue(undefined),
    }

    useWebDriverBiDi = true
    stubbedBiDiAutomation = {
      automationMiddleware: {},
      setTopLevelContextId: vi.fn(),
    }

    vi.spyOn(BidiAutomation, 'create').mockReturnValue(stubbedBiDiAutomation as unknown as BidiAutomation)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('.setup()', () => {
    describe('when using bidi', () => {
      it('registers the automation middleware with the automation system', async () => {
        await FirefoxUtil.setup({ automation: automation as unknown as Automation, onError, url, remotePort, webdriverClient, useWebDriverBiDi })

        expect(automation.use).toHaveBeenCalledWith(stubbedBiDiAutomation.automationMiddleware)
      })
    })
  })
})
