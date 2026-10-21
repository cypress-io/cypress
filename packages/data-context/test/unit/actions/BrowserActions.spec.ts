import { describe, expect, it, jest } from '@jest/globals'
import type { FoundBrowser } from '@packages/types'
import { createTestDataContext } from '../helper'

const browser: FoundBrowser = { name: 'firefox', family: 'firefox', channel: 'stable', displayName: 'Firefox', path: '', version: '' }

function createDataContext (mode: 'run' | 'open') {
  const ctx = createTestDataContext(mode)

  ctx._apis.projectApi.insertProjectPreferencesToCache = jest.fn()
  // @ts-expect-error
  ctx.lifecycleManager._projectRoot = '/path/to/my-project'

  return ctx
}

describe('BrowserActions', () => {
  describe('#setActiveBrowser', () => {
    it('sets the active browser without writing lastBrowser to the cache in run mode', () => {
      const ctx = createDataContext('run')

      ctx.actions.browser.setActiveBrowser(browser)

      expect(ctx.coreData.activeBrowser).toBe(browser)
      expect(ctx._apis.projectApi.insertProjectPreferencesToCache).not.toHaveBeenCalled()
    })

    it('sets the active browser and writes lastBrowser to the cache in open mode', () => {
      const ctx = createDataContext('open')

      ctx.actions.browser.setActiveBrowser(browser)

      expect(ctx.coreData.activeBrowser).toBe(browser)
      expect(ctx._apis.projectApi.insertProjectPreferencesToCache).toHaveBeenCalledWith('my-project', {
        lastBrowser: { name: 'firefox', channel: 'stable' },
      })
    })
  })
})
