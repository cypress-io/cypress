import chai, { expect } from 'chai'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

describe('ProjectLifecycleManager', () => {
  let ctx: DataContext
  let lifecycleManager: any

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

  context('#refreshLifecycle', () => {
    it('executes refreshLifecycleAsync with no errors', () => {
      const refreshLifecycleAsyncStub = sinon.stub(lifecycleManager, 'refreshLifeCycleAsync').resolves()

      lifecycleManager.refreshLifecycle()

      expect(refreshLifecycleAsyncStub).to.have.been.called
    })

    it('executes refreshLifecycleAsync and handles errors', (done) => {
      const refreshLifecycleAsyncStub = sinon.stub(lifecycleManager, 'refreshLifeCycleAsync').rejects()

      sinon.stub(lifecycleManager, 'onLoadError').callsFake(() => {
        expect(refreshLifecycleAsyncStub).to.have.been.called
        done()
      })

      lifecycleManager.refreshLifecycle()
    })
  })

  context('#refreshLifeCycleAsync', () => {
    it('resets the loading state, notifies launchpad, initializes config, and loads the testing type if ready and configured', async () => {
      lifecycleManager._projectRoot = 'root'
      lifecycleManager._currentTestingType = 'e2e'
      lifecycleManager._configManager = {
        resetLoadingState: sinon.stub(),
        loadTestingType: sinon.stub(),
        destroy: sinon.stub(),
      }

      const readyToInitializeStub = sinon.stub(lifecycleManager, 'readyToInitialize').returns(true)
      const toLaunchpadStub = sinon.stub(ctx.emitter, 'toLaunchpad')
      const initialConfigStub = sinon.stub(lifecycleManager, 'initializeConfig').resolves()
      const isTestingTypeConfiguredStub = sinon.stub(lifecycleManager, 'isTestingTypeConfigured').returns(true)

      await lifecycleManager.refreshLifeCycleAsync()

      expect(readyToInitializeStub).to.have.been.calledWith('root')
      expect(lifecycleManager._configManager.resetLoadingState).to.have.been.called
      expect(toLaunchpadStub).to.have.been.called
      expect(initialConfigStub).to.have.been.called
      expect(isTestingTypeConfiguredStub).to.have.been.calledWith('e2e')
      expect(lifecycleManager._configManager.loadTestingType).to.have.been.called
    })

    it('resets the loading state, notifies launchpad, initializes config, and clears the current testing type if there is no testing type', async () => {
      lifecycleManager._projectRoot = 'root'
      lifecycleManager._configManager = {
        resetLoadingState: sinon.stub(),
        loadTestingType: sinon.stub(),
        destroy: sinon.stub(),
      }

      const readyToInitializeStub = sinon.stub(lifecycleManager, 'readyToInitialize').returns(true)
      const toLaunchpadStub = sinon.stub(ctx.emitter, 'toLaunchpad')
      const initialConfigStub = sinon.stub(lifecycleManager, 'initializeConfig').resolves()
      const setAndLoadCurrentTestingTypeStub = sinon.stub(lifecycleManager, 'setAndLoadCurrentTestingType')

      await lifecycleManager.refreshLifeCycleAsync()

      expect(readyToInitializeStub).to.have.been.calledWith('root')
      expect(lifecycleManager._configManager.resetLoadingState).to.have.been.called
      expect(toLaunchpadStub).to.have.been.called
      expect(initialConfigStub).to.have.been.called
      expect(setAndLoadCurrentTestingTypeStub).to.have.been.calledWith(null)
    })

    it('does nothing if not ready to initialize', async () => {
      lifecycleManager._projectRoot = 'root'
      lifecycleManager._configManager = {
        resetLoadingState: sinon.stub(),
        loadTestingType: sinon.stub(),
        destroy: sinon.stub(),
      }

      const readyToInitializeStub = sinon.stub(lifecycleManager, 'readyToInitialize').returns(false)
      const toLaunchpadStub = sinon.stub(ctx.emitter, 'toLaunchpad')
      const initialConfigStub = sinon.stub(lifecycleManager, 'initializeConfig').resolves()
      const isTestingTypeConfiguredStub = sinon.stub(lifecycleManager, 'isTestingTypeConfigured').returns(true)
      const setAndLoadCurrentTestingTypeStub = sinon.stub(lifecycleManager, 'setAndLoadCurrentTestingType')

      await lifecycleManager.refreshLifeCycleAsync()

      expect(readyToInitializeStub).to.have.been.calledWith('root')
      expect(lifecycleManager._configManager.resetLoadingState).not.to.have.been.called
      expect(toLaunchpadStub).not.to.have.been.called
      expect(initialConfigStub).not.to.have.been.called
      expect(isTestingTypeConfiguredStub).not.to.have.been.called
      expect(setAndLoadCurrentTestingTypeStub).not.to.have.been.called
    })
  })

  // if (this._projectRoot && this._configManager && this.readyToInitialize(this._projectRoot)) {
  //   this._configManager.resetLoadingState()

  //   // Emit here so that the user gets the impression that we're loading rather than waiting for a full refresh of the config for an update
  //   this.ctx.emitter.toLaunchpad()

  //   await this.initializeConfig()

  //   if (this._currentTestingType && this.isTestingTypeConfigured(this._currentTestingType)) {
  //     this._configManager.loadTestingType()
  //   } else {
  //     this.setAndLoadCurrentTestingType(null)
  //   }
  // }
})
