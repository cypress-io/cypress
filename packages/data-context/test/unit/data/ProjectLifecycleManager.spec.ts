import { expect } from 'chai'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import sinon from 'sinon'
import { FullConfig } from '@packages/types'

const browsers = [
  { name: 'electron', family: 'chromium', channel: 'stable', displayName: 'Electron' },
  { name: 'chrome', family: 'chromium', channel: 'stable', displayName: 'Chrome' },
  { name: 'chrome', family: 'chromium', channel: 'beta', displayName: 'Chrome Beta' },
]

let ctx: DataContext

function createDataContext (modeOptions?: Parameters<typeof createTestDataContext>[1]) {
  const context = createTestDataContext('open', modeOptions)

  context.coreData.activeBrowser = undefined
  context.coreData.cliBrowser = undefined

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
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
      })

      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('electron').resolves(browsers[0])

      ctx.coreData.cliBrowser = 'electron'

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
