import { expect } from 'chai'
import { StudioManager } from '../../lib/cloud/studio'
import { StudioLifecycleManager } from '../../lib/StudioLifecycleManager'
import { sinon } from '../spec_helper'
import type { DataContext } from '@packages/data-context'
import type { Cfg } from '../../lib/project-base'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import * as getAndInitializeStudioManagerModule from '../../lib/cloud/api/studio/get_and_initialize_studio_manager'
import ProtocolManager from '../../lib/cloud/protocol'
const api = require('../../lib/cloud/api').default

// Helper to wait for next tick in event loop
const nextTick = () => new Promise((resolve) => process.nextTick(resolve))

describe('StudioLifecycleManager', () => {
  let studioLifecycleManager: StudioLifecycleManager
  let mockStudioManager: StudioManager
  let mockCtx: DataContext
  let mockCloudDataSource: CloudDataSource
  let mockCfg: Cfg
  let getAndInitializeStudioManagerStub: sinon.SinonStub
  let emitSpy: sinon.SinonSpy
  let getCaptureProtocolScriptStub: sinon.SinonStub
  let prepareProtocolStub: sinon.SinonStub

  beforeEach(() => {
    studioLifecycleManager = new StudioLifecycleManager()
    mockStudioManager = {
      addSocketListeners: sinon.stub(),
      canAccessStudioAI: sinon.stub().resolves(true),
      status: 'INITIALIZED',
    } as unknown as StudioManager

    mockCtx = {
      update: sinon.stub(),
      coreData: {},
    } as unknown as DataContext

    mockCloudDataSource = {} as CloudDataSource

    mockCfg = {
      projectId: 'abc123',
      testingType: 'e2e',
      projectRoot: '/test/project',
      port: 8888,
      proxyUrl: 'http://localhost:8888',
      devServerPublicPathRoute: '/__cypress/src',
      namespace: '__cypress',
    } as unknown as Cfg

    // Use spy instead of stub for emit to allow the actual emit functionality to work
    emitSpy = sinon.spy(studioLifecycleManager, 'emit')

    // Stub the getAndInitializeStudioManager function
    getAndInitializeStudioManagerStub = sinon.stub(getAndInitializeStudioManagerModule, 'getAndInitializeStudioManager')
    getAndInitializeStudioManagerStub.resolves(mockStudioManager)

    // Stub protocol data
    getCaptureProtocolScriptStub = sinon.stub(api, 'getCaptureProtocolScript').resolves('console.log("hello")')
    prepareProtocolStub = sinon.stub(ProtocolManager.prototype, 'prepareProtocol').resolves()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('initializeStudioManager', () => {
    it('initializes the studio manager and registers it in the data context', async () => {
      studioLifecycleManager.initializeStudioManager({
        projectId: 'test-project-id',
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      const studioReadyPromise = new Promise((resolve) => {
        studioLifecycleManager?.onStudioReady((studioManager) => {
          resolve(studioManager)
        })
      })

      await studioReadyPromise

      expect(mockCtx.update).to.be.calledOnce
      expect(studioLifecycleManager.studioManagerPromise).to.not.be.null
      expect(emitSpy).to.be.calledWith('studio:ready', mockStudioManager)
    })

    it('sets up protocol if studio is enabled', async () => {
      mockStudioManager.status = 'ENABLED'

      studioLifecycleManager.initializeStudioManager({
        projectId: 'abc123',
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      const studioReadyPromise = new Promise((resolve) => {
        studioLifecycleManager?.onStudioReady((studioManager) => {
          resolve(studioManager)
        })
      })

      await studioReadyPromise

      expect(getCaptureProtocolScriptStub).to.be.calledWith('http://localhost:1234/capture-protocol/script/current.js')
      expect(prepareProtocolStub).to.be.calledWith('console.log("hello")', {
        runId: 'studio',
        projectId: 'abc123',
        testingType: 'e2e',
        cloudApi: {
          url: 'http://localhost:1234/',
          retryWithBackoff: api.retryWithBackoff,
          requestPromise: api.rp,
        },
        projectConfig: {
          devServerPublicPathRoute: '/__cypress/src',
          namespace: '__cypress',
          port: 8888,
          proxyUrl: 'http://localhost:8888',
        },
        mountVersion: 2,
        debugData: {},
        mode: 'studio',
      })
    })

    it('handles errors during initialization', async () => {
      const error = new Error('Test error')

      getAndInitializeStudioManagerStub.rejects(error)

      // Should not throw
      await studioLifecycleManager.initializeStudioManager({
        projectId: 'test-project-id',
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      // Should still update the context
      expect(mockCtx.update).to.be.calledOnce
      const result = await studioLifecycleManager.studioManagerPromise

      expect(result).to.be.null
    })
  })

  describe('isStudioReady', () => {
    it('returns false when studioManagerPromise is null', () => {
      expect(studioLifecycleManager.isStudioReady()).to.be.false
    })

    it('returns true when studioManagerPromise is set', async () => {
      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)

      expect(studioLifecycleManager.isStudioReady()).to.be.true
    })
  })

  describe('getStudioIfReady', () => {
    it('returns null when studioManagerPromise is null', () => {
      expect(studioLifecycleManager.getStudioIfReady()).to.be.null
    })

    it('returns the promise when studioManagerPromise is set', async () => {
      const promise = Promise.resolve(mockStudioManager)

      studioLifecycleManager.studioManagerPromise = promise

      expect(studioLifecycleManager.getStudioIfReady()).to.equal(promise)
    })
  })

  describe('getStudio', () => {
    it('throws an error when studioManagerPromise is null', async () => {
      try {
        await studioLifecycleManager.getStudio()
        expect.fail('Expected method to throw')
      } catch (error) {
        expect(error.message).to.equal('Studio manager has not been initialized')
      }
    })

    it('returns the resolved promise when studioManagerPromise is set', async () => {
      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)

      const result = await studioLifecycleManager.getStudio()

      expect(result).to.equal(mockStudioManager)
    })
  })

  describe('onStudioReady', () => {
    it('registers a listener with once() for studio:ready event', () => {
      const onceSpy = sinon.spy(studioLifecycleManager, 'once')
      const listener = sinon.stub()

      studioLifecycleManager.onStudioReady(listener)

      expect(onceSpy).to.be.calledWith('studio:ready', listener)
    })

    it('returns a function to remove the listener', () => {
      const offSpy = sinon.spy(studioLifecycleManager, 'off')
      const listener = sinon.stub()

      const removeListener = studioLifecycleManager.onStudioReady(listener)

      removeListener()

      expect(offSpy).to.be.calledWith('studio:ready', listener)
    })

    it('calls listener immediately if studioManagerPromise is already resolved', async () => {
      const listener = sinon.stub()

      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)
      // Ensure promise is resolved
      await nextTick()

      studioLifecycleManager.onStudioReady(listener)
      // Need another tick to let the promise in onStudioReady resolve
      await nextTick()

      expect(listener).to.be.calledWith(mockStudioManager)
    })

    it('does not call listener if studioManagerPromise resolves to null', async () => {
      const listener = sinon.stub()
      const offSpy = sinon.spy(studioLifecycleManager, 'off')

      studioLifecycleManager.studioManagerPromise = Promise.resolve(null)
      // Ensure promise is resolved
      await nextTick()

      studioLifecycleManager.onStudioReady(listener)
      // Need another tick to let the promise in onStudioReady resolve
      await nextTick()

      expect(listener).not.to.be.called
      // The listener should still be removed to prevent it from being called if another studioManager is set
      expect(offSpy).to.be.calledWith('studio:ready', listener)
    })

    it('removes the listener after immediate call to prevent double execution', async () => {
      const offSpy = sinon.spy(studioLifecycleManager, 'off')
      const listener = sinon.stub()

      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)
      // Ensure promise is resolved
      await nextTick()

      studioLifecycleManager.onStudioReady(listener)
      // Need another tick to let the promise in onStudioReady resolve
      await nextTick()

      expect(offSpy).to.be.calledWith('studio:ready', listener)
    })
  })
})
