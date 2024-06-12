import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { FullConfig } from '@packages/types'
import { createTestDataContext } from '../helper'
import { userBrowser, foundBrowserChrome } from '../../fixtures/browsers'

chai.use(sinonChai)
const { expect } = chai

describe('BrowserDataSource', () => {
  describe('#allBrowsers', () => {
    it('returns machine browser if no user custom browsers resolved in config', async () => {
      const fullConfig: FullConfig = {
        resolved: {},
        browsers: [],
      }

      const ctx = createTestDataContext('run')

      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig').resolves(fullConfig)
      ctx.coreData.machineBrowsers = Promise.resolve([foundBrowserChrome])

      const result = await ctx.browser.allBrowsers()

      expect(result).to.eql([foundBrowserChrome])
    })

    it('populates coreData.allBrowsers is not populated', async () => {
      const fullConfig: FullConfig = {
        resolved: {},
        browsers: [userBrowser],
      }

      const ctx = createTestDataContext('run')

      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig').resolves(fullConfig)
      ctx.coreData.machineBrowsers = Promise.resolve([foundBrowserChrome])

      const result = await ctx.browser.allBrowsers()

      expect(result.length).to.eq(2)
      expect(result[1].custom).to.be.true
    })

    it('does not add user custom browser if name and version matches a machine browser', async () => {
      const browser = { ...userBrowser, name: 'aaa', version: '100' }
      const machineBrowser = { ...foundBrowserChrome, name: 'aaa', version: '100' }

      const fullConfig: FullConfig = {
        resolved: {},
        browsers: [browser],
      }

      const ctx = createTestDataContext('run')

      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig').resolves(fullConfig)
      ctx.coreData.machineBrowsers = Promise.resolve([machineBrowser])

      const result = await ctx.browser.allBrowsers()

      expect(result).to.eql([machineBrowser])
    })

    it('returns coreData.allBrowsers if populated', async () => {
      const allBrowsers = [foundBrowserChrome]
      const ctx = createTestDataContext('run')

      ctx.coreData.allBrowsers = Promise.resolve(allBrowsers)

      const result = await ctx.browser.allBrowsers()

      expect(result).to.eql(allBrowsers)
    })
  })
})
