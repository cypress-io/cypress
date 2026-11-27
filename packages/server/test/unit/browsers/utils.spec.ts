import { describe, expect, it, vi } from 'vitest'
import utils from '../../../lib/browsers/utils'
import { DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION } from '@packages/proxy/lib/http/util/disable-navigation-preload'

describe('lib/browsers/utils', () => {
  describe('#initializeCDP', () => {
    function createCriClient () {
      return {
        send: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      }
    }

    it('includes the window navigation-preload expression in the new-document bootstrap script when useBrowserNetworkInterception is true', async () => {
      const criClient = createCriClient()

      await utils.initializeCDP(criClient as any, {} as any, true)

      const call = criClient.send.mock.calls.find((c) => c[0] === 'Page.addScriptToEvaluateOnNewDocument')

      expect(call).toBeDefined()
      expect(call![1].source).toContain(DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION)
      // The assembled source concatenates several independently-authored
      // blocks; confirm the result still parses as a script.
      expect(() => new Function(call![1].source)).not.toThrow()
    })

    it('excludes the window navigation-preload expression from the new-document bootstrap script when useBrowserNetworkInterception is false', async () => {
      const criClient = createCriClient()

      await utils.initializeCDP(criClient as any, {} as any, false)

      const call = criClient.send.mock.calls.find((c) => c[0] === 'Page.addScriptToEvaluateOnNewDocument')

      expect(call).toBeDefined()
      expect(call![1].source).not.toContain(DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION)
      expect(() => new Function(call![1].source)).not.toThrow()
    })
  })
})
