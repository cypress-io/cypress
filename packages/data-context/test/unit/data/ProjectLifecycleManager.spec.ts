import { expect } from 'chai'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import sinon from 'sinon'

describe('ProjectLifecycleManager', () => {
  let ctx: DataContext
  let lifecycleManager: {
    setInitialActiveBrowser: () => Promise<void>
  }

  beforeEach(() => {
    ctx = createTestDataContext('open')
    lifecycleManager = ctx.lifecycleManager as any
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
      ctx.project.getProjectPreferences = sinon.stub().resolves(null)
      // @ts-expect-error
      ctx.lifecycleManager._projectRoot = 'foo'
    })

    it('falls back to browsers[0] if preferences and cliBrowser do not exist', async () => {
      await lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
    })

    it('uses cli --browser option if one is set', async () => {
      ctx._apis.browserApi.ensureAndGetByNameOrPath = sinon.stub().withArgs('electron').resolves(browsers[0])

      ctx.coreData.cliBrowser = 'electron'

      await lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.cliBrowser).to.eq('electron')
      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
    })

    it('uses lastBrowser if available', async () => {
      ctx.project.getProjectPreferences = sinon.stub().resolves({ lastBrowser: { name: 'chrome', channel: 'beta' } })

      await lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'chrome', displayName: 'Chrome Beta' })
    })

    it('falls back to browsers[0] if lastBrowser does not exist', async () => {
      ctx.project.getProjectPreferences = sinon.stub().resolves({ lastBrowser: { name: 'chrome', channel: 'dev' } })

      await lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).to.include({ name: 'electron' })
    })
  })
})
