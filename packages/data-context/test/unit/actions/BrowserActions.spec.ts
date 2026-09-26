import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'

const browser = { name: 'chrome', family: 'chromium', channel: 'stable', displayName: 'Chrome', path: '', version: '' } as FoundBrowser

describe('BrowserActions', () => {
  let ctx: DataContext
  let onUnhandledRejection: jest.Mock

  beforeEach(() => {
    ctx = createTestDataContext('open')
    // @ts-expect-error
    ctx.lifecycleManager._projectRoot = '/path/to/project'

    onUnhandledRejection = jest.fn()
    process.on('unhandledRejection', onUnhandledRejection)
  })

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection)
  })

  describe('setActiveBrowser', () => {
    it('sets the active browser without an unhandled rejection when saving it to the cache fails', async () => {
      const insertProjectPreferencesToCache = jest.fn(() => Promise.reject(new Error('another Cypress process appears to hold its lock')))

      ctx._apis.projectApi.insertProjectPreferencesToCache = insertProjectPreferencesToCache

      ctx.actions.browser.setActiveBrowser(browser)

      // unhandledRejection is emitted once the microtask queue drains
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(insertProjectPreferencesToCache).toHaveBeenCalledWith('project', { lastBrowser: { name: 'chrome', channel: 'stable' } })
      expect(ctx.coreData.activeBrowser).toBe(browser)
      expect(onUnhandledRejection).not.toHaveBeenCalled()
    })
  })
})
