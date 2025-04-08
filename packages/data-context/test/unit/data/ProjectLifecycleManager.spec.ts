import { expect } from 'chai'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import sinon from 'sinon'
import { FoundBrowser, FullConfig } from '@packages/types'

const browsers = [
  { name: 'electron', family: 'chromium', channel: 'stable', displayName: 'Electron' },
  { name: 'chrome', family: 'chromium', channel: 'stable', displayName: 'Chrome' },
  { name: 'chrome', family: 'chromium', channel: 'beta', displayName: 'Chrome Beta' },
  { name: 'firefox', family: 'firefox', channel: 'stable', displayName: 'Firefox' },
]

let ctx: DataContext

function createDataContext (modeOptions?: Parameters<typeof createTestDataContext>[1]) {
  const context = createTestDataContext('open', modeOptions)

  context._apis.browserApi.getBrowsers = sinon.stub().resolves(browsers)
  context._apis.projectApi.insertProjectPreferencesToCache = sinon.stub()
  context.actions.project.launchProject = sinon.stub().resolves()
  context.project.getProjectPreferences = sinon.stub().resolves(null)

  // @ts-expect-error
  context.lifecycleManager._projectRoot = 'foo'

  return context
}

const fullConfig: FullConfig = {
  resolved: {},
  browsers: [],
}

describe('ProjectLifecycleManager', () => {
  beforeEach(() => {
    ctx = createDataContext()
    sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig').resolves(fullConfig)
  })

  context('#setInitialActiveBrowser', () => {
    it('falls back to browsers[0] if preferences and cliBrowser do not exist', async () => {
      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = null

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })

    it('uses cli --browser option if one is set', async () => {
      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('electron').resolves(browsers[0])

      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = 'electron'

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.cliBrowser).to.eq('electron')
      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })

    it('uses cli --browser option and launches project if `--project --testingType` were used', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
      })

      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('electron').resolves(browsers[0])

      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = 'electron'

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.cliBrowser).to.eq('electron')
      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.be.calledOnce
    })

    it('uses lastBrowser if available', async () => {
      ctx.project.getProjectPreferences = sinon.stub().resolves({ lastBrowser: { name: 'chrome', channel: 'beta' } })
      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = null

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'chrome', displayName: 'Chrome Beta' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })

    it('falls back to browsers[0] if lastBrowser does not exist', async () => {
      ctx.project.getProjectPreferences = sinon.stub().resolves({ lastBrowser: { name: 'chrome', channel: 'dev' } })
      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = null

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })

    it('uses config defaultBrowser option if --browser is not given', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
        isBrowserGivenByCli: false,
      })

      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('chrome').resolves(browsers[1])
      sinon.stub(ctx.lifecycleManager, 'loadedFullConfig').get(() => ({ defaultBrowser: 'chrome' }))

      expect(ctx.modeOptions.browser).to.eq(undefined)
      expect(ctx.coreData.cliBrowser).to.eq(null)
      expect(ctx.coreData.activeBrowser).to.eq(null)

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.modeOptions.browser).to.eq('chrome')
      expect(ctx.coreData.cliBrowser).to.eq('chrome')
      expect(ctx.coreData.activeBrowser).to.eq(browsers[1])
    })

    it('doesn\'t use config defaultBrowser option if --browser is given', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
        browser: 'firefox',
        isBrowserGivenByCli: true,
      })

      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig').resolves(fullConfig)
      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('firefox').resolves(browsers[3])
      sinon.stub(ctx.lifecycleManager, 'loadedFullConfig').get(() => ({ defaultBrowser: 'chrome' }))

      expect(ctx.modeOptions.browser).to.eq('firefox')
      expect(ctx.coreData.cliBrowser).to.eq('firefox')
      expect(ctx.coreData.activeBrowser).to.eq(null)

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.modeOptions.browser).to.eq('firefox')
      expect(ctx.coreData.cliBrowser).to.eq('firefox')
      expect(ctx.coreData.activeBrowser).to.eq(browsers[3])
    })

    it('ignores the defaultBrowser if there is an active browser and updates the CLI browser to the active browser', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
        isBrowserGivenByCli: false,
      })

      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig').resolves(fullConfig)
      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('chrome:beta').resolves(browsers[2])
      // the default browser will be ignored since we have an active browser
      sinon.stub(ctx.lifecycleManager, 'loadedFullConfig').get(() => ({ defaultBrowser: 'firefox' }))

      // set the active browser to chrome:beta
      ctx.actions.browser.setActiveBrowser(browsers[2] as FoundBrowser)

      expect(ctx.modeOptions.browser).to.eq(undefined)
      expect(ctx.coreData.cliBrowser).to.eq(null)
      expect(ctx.coreData.activeBrowser).to.eq(browsers[2])

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.modeOptions.browser).to.eq('chrome:beta')
      expect(ctx.coreData.cliBrowser).to.eq('chrome:beta')
      expect(ctx.coreData.activeBrowser).to.eq(browsers[2])
    })
  })

  context('#eventProcessPid', () => {
    it('returns process id from config manager', () => {
      // @ts-expect-error
      ctx.lifecycleManager._configManager = {
        eventProcessPid: 12399,
        destroy: () => {},
      }

      expect(ctx.lifecycleManager.eventProcessPid).to.eq(12399)
    })

    it('does not throw if config manager is not initialized', () => {
      // @ts-expect-error
      ctx.lifecycleManager._configManager = undefined
      expect(ctx.lifecycleManager.eventProcessPid).to.eq(undefined)
    })
  })
})
