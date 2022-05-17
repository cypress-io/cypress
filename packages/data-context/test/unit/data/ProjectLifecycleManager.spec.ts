import { expect } from 'chai'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import sinon from 'sinon'

describe('ProjectLifecycleManager', () => {
  let ctx: DataContext

  beforeEach(() => {
    ctx = createTestDataContext('open')
  })

  context('#setInitialActiveBrowser', () => {
    const browsers = [
      { name: 'electron', family: 'chromium', channel: 'stable', displayName: 'Electron' },
      { name: 'chrome', family: 'chromium', channel: 'stable', displayName: 'Chrome' },
      { name: 'chrome', family: 'chromium', channel: 'beta', displayName: 'Chrome Beta' },
    ]

    beforeEach(() => {
      ctx.coreData.activeBrowser = undefined
      ctx.coreData.cliBrowser = undefined

      ctx._apis.browserApi.getBrowsers = sinon.stub().resolves(browsers)
      ctx._apis.browserApi.relaunchBrowser = sinon.stub().resolves()
      ctx.actions.project.launchProject = sinon.stub().resolves()
      ctx.project.getProjectPreferences = sinon.stub().resolves(null)
      // @ts-expect-error
      ctx.lifecycleManager._projectRoot = 'foo'
    })

    it('falls back to browsers[0] if preferences and cliBrowser do not exist', async () => {
      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })

    it('uses cli --browser option if one is set', async () => {
      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('electron').resolves(browsers[0])

      ctx.coreData.cliBrowser = 'electron'

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.cliBrowser).to.eq('electron')
      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })

    it('uses cli --browser option and launches project if `--project --testingType` were used', async () => {
      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('electron').resolves(browsers[0])

      ctx.coreData.cliBrowser = 'electron'

      // @ts-expect-error
      ctx._modeOptions.project = 'foo'
      // @ts-expect-error
      ctx._modeOptions.testingType = 'e2e'

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.cliBrowser).to.eq('electron')
      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.be.calledOnce
    })

    it('uses lastBrowser if available', async () => {
      ctx.project.getProjectPreferences = sinon.stub().resolves({ lastBrowser: { name: 'chrome', channel: 'beta' } })

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'chrome', displayName: 'Chrome Beta' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })

    it('falls back to browsers[0] if lastBrowser does not exist', async () => {
      ctx.project.getProjectPreferences = sinon.stub().resolves({ lastBrowser: { name: 'chrome', channel: 'dev' } })

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
      expect(ctx.actions.project.launchProject).to.not.be.called
    })
  })
})
