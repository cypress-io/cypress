import { describe, expect, it, jest } from '@jest/globals'
import { FullConfig } from '@packages/types'
import { createTestDataContext } from '../helper'
import { userBrowser, foundBrowserChrome } from '../../fixtures/browsers'

describe('BrowserDataSource', () => {
  describe('#allBrowsers', () => {
    it('returns machine browser if no user custom browsers resolved in config', async () => {
      const fullConfig: FullConfig = {
        resolved: {},
        browsers: [],
      }

      const ctx = createTestDataContext('run')

      jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
      ctx.coreData.machineBrowsers = Promise.resolve([foundBrowserChrome])

      const result = await ctx.browser.allBrowsers()

      expect(result).toEqual([foundBrowserChrome])
    })

    it('populates coreData.allBrowsers is not populated', async () => {
      const fullConfig: FullConfig = {
        resolved: {},
        browsers: [userBrowser],
      }

      const ctx = createTestDataContext('run')

      jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
      ctx.coreData.machineBrowsers = Promise.resolve([foundBrowserChrome])

      const result = await ctx.browser.allBrowsers()

      expect(result.length).toEqual(2)
      expect(result[1].custom).toEqual(true)
    })

    it('does not add user custom browser if name and version matches a machine browser', async () => {
      const browser = { ...userBrowser, name: 'aaa', version: '100' }
      const machineBrowser = { ...foundBrowserChrome, name: 'aaa', version: '100' }

      const fullConfig: FullConfig = {
        resolved: {},
        browsers: [browser],
      }

      const ctx = createTestDataContext('run')

      jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
      ctx.coreData.machineBrowsers = Promise.resolve([machineBrowser])

      const result = await ctx.browser.allBrowsers()

      expect(result).toEqual([machineBrowser])
    })

    it('returns coreData.allBrowsers if populated', async () => {
      const allBrowsers = [foundBrowserChrome]
      const ctx = createTestDataContext('run')

      ctx.coreData.allBrowsers = Promise.resolve(allBrowsers)

      const result = await ctx.browser.allBrowsers()

      expect(result).toEqual(allBrowsers)
    })
  })
})
