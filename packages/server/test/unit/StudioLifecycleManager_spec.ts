import { sinon } from '../spec_helper'
import { expect } from 'chai'
import { StudioManager } from '../../lib/cloud/studio'
import { StudioLifecycleManager } from '../../lib/StudioLifecycleManager'
import type { DataContext } from '@packages/data-context'
import type { Cfg } from '../../lib/project-base'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import * as getAndInitializeStudioManagerModule from '../../lib/cloud/api/studio/get_and_initialize_studio_manager'
import * as reportStudioErrorPath from '../../lib/cloud/api/studio/report_studio_error'
import ProtocolManager from '../../lib/cloud/protocol'
const api = require('../../lib/cloud/api').default
import * as postStudioSessionModule from '../../lib/cloud/api/studio/post_studio_session'

// Helper to wait for next tick in event loop
const nextTick = () => new Promise((resolve) => process.nextTick(resolve))

describe('StudioLifecycleManager', () => {
  let studioLifecycleManager: StudioLifecycleManager
  let mockStudioManager: StudioManager
  let mockCtx: DataContext
  let mockCloudDataSource: CloudDataSource
  let mockCfg: Cfg
  let postStudioSessionStub: sinon.SinonStub
  let getAndInitializeStudioManagerStub: sinon.SinonStub
  let getCaptureProtocolScriptStub: sinon.SinonStub
  let prepareProtocolStub: sinon.SinonStub
  let reportStudioErrorStub: sinon.SinonStub
  let studioStatusChangeEmitterStub: sinon.SinonStub

  beforeEach(() => {
    studioLifecycleManager = new StudioLifecycleManager()
    mockStudioManager = {
      addSocketListeners: sinon.stub(),
      canAccessStudioAI: sinon.stub().resolves(true),
      status: 'INITIALIZED',
    } as unknown as StudioManager

    studioStatusChangeEmitterStub = sinon.stub()

    mockCtx = {
      update: sinon.stub(),
      coreData: {},
      cloud: {
        getCloudUrl: sinon.stub().returns('https://cloud.cypress.io'),
        additionalHeaders: sinon.stub().resolves({ 'Authorization': 'Bearer test-token' }),
      },
      emitter: {
        studioStatusChange: studioStatusChangeEmitterStub,
      },
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

    postStudioSessionStub = sinon.stub(postStudioSessionModule, 'postStudioSession')
    postStudioSessionStub.resolves({
      studioUrl: 'https://cloud.cypress.io/studio/bundle/abc.tgz',
      protocolUrl: 'https://cloud.cypress.io/capture-protocol/script/def.js',
    })

    getAndInitializeStudioManagerStub = sinon.stub(getAndInitializeStudioManagerModule, 'getAndInitializeStudioManager')
    getAndInitializeStudioManagerStub.resolves(mockStudioManager)

    getCaptureProtocolScriptStub = sinon.stub(api, 'getCaptureProtocolScript').resolves('console.log("hello")')
    prepareProtocolStub = sinon.stub(ProtocolManager.prototype, 'prepareProtocol').resolves()

    reportStudioErrorStub = sinon.stub(reportStudioErrorPath, 'reportStudioError')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('cloudStudioRequested', () => {
    it('is true when CYPRESS_ENABLE_CLOUD_STUDIO is set', async () => {
      process.env.CYPRESS_ENABLE_CLOUD_STUDIO = '1'
      delete process.env.CYPRESS_LOCAL_STUDIO_PATH

      expect(studioLifecycleManager.cloudStudioRequested).to.be.true
    })

    it('is true when CYPRESS_LOCAL_STUDIO_PATH is set', async () => {
      delete process.env.CYPRESS_ENABLE_CLOUD_STUDIO
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'

      expect(studioLifecycleManager.cloudStudioRequested).to.be.true
    })

    it('is false when neither env variable is set', async () => {
      delete process.env.CYPRESS_ENABLE_CLOUD_STUDIO
      delete process.env.CYPRESS_LOCAL_STUDIO_PATH

      expect(studioLifecycleManager.cloudStudioRequested).to.be.false
    })

    it('is true when both env variables are set', async () => {
      process.env.CYPRESS_ENABLE_CLOUD_STUDIO = '1'
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'

      expect(studioLifecycleManager.cloudStudioRequested).to.be.true
    })
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
        studioLifecycleManager?.registerStudioReadyListener((studioManager) => {
          resolve(studioManager)
        })
      })

      await studioReadyPromise

      expect(mockCtx.update).to.be.calledOnce
      expect(studioLifecycleManager.isStudioReady()).to.be.true
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
        studioLifecycleManager?.registerStudioReadyListener((studioManager) => {
          resolve(studioManager)
        })
      })

      await studioReadyPromise

      expect(postStudioSessionStub).to.be.calledWith({
        projectId: 'abc123',
      })

      expect(getCaptureProtocolScriptStub).to.be.calledWith('https://cloud.cypress.io/capture-protocol/script/def.js')
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

    it('handles errors during initialization and reports them', async () => {
      const error = new Error('Test error')
      const listener1 = sinon.stub()
      const listener2 = sinon.stub()

      // Register listeners that should be cleaned up
      studioLifecycleManager.registerStudioReadyListener(listener1)
      studioLifecycleManager.registerStudioReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).to.equal(2)

      getAndInitializeStudioManagerStub.rejects(error)

      const reportErrorPromise = new Promise<void>((resolve) => {
        reportStudioErrorStub.callsFake(() => {
          resolve()

          return undefined
        })
      })

      // Should not throw
      studioLifecycleManager.initializeStudioManager({
        projectId: 'test-project-id',
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      await reportErrorPromise

      expect(mockCtx.update).to.be.calledOnce

      // @ts-expect-error - accessing private property
      const studioPromise = studioLifecycleManager.studioManagerPromise

      expect(studioPromise).to.not.be.null

      expect(reportStudioErrorStub).to.be.calledOnce
      expect(reportStudioErrorStub).to.be.calledWithMatch({
        cloudApi: sinon.match.object,
        studioHash: 'test-project-id',
        projectSlug: 'abc123',
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Test error')),
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      })

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).to.equal(0)

      expect(listener1).not.to.be.called
      expect(listener2).not.to.be.called

      if (studioPromise) {
        const result = await studioPromise

        expect(result).to.be.null
      }
    })
  })

  describe('isStudioReady', () => {
    it('returns false when studio manager has not been initialized', () => {
      expect(studioLifecycleManager.isStudioReady()).to.be.false
    })

    it('returns true when studio has been initialized', async () => {
      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = mockStudioManager

      expect(studioLifecycleManager.isStudioReady()).to.be.true
    })
  })

  describe('getStudio', () => {
    it('throws an error when studio manager is not initialized', async () => {
      try {
        await studioLifecycleManager.getStudio()
        expect.fail('Expected method to throw')
      } catch (error) {
        expect(error.message).to.equal('Studio manager has not been initialized')
      }
    })

    it('returns the studio manager when initialized', async () => {
      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)

      const result = await studioLifecycleManager.getStudio()

      expect(result).to.equal(mockStudioManager)
    })
  })

  describe('registerStudioReadyListener', () => {
    it('registers a listener that will be called when studio is ready', () => {
      const listener = sinon.stub()

      studioLifecycleManager.registerStudioReadyListener(listener)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).to.include(listener)
    })

    it('calls listener immediately if studio is already ready', async () => {
      const listener = sinon.stub()

      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = mockStudioManager

      // @ts-expect-error - accessing non-existent property
      studioLifecycleManager.studioReady = true

      await Promise.resolve()

      studioLifecycleManager.registerStudioReadyListener(listener)

      await Promise.resolve()
      await Promise.resolve()
      await nextTick()

      expect(listener).to.be.calledWith(mockStudioManager)
    })

    it('does not call listener if studio manager is null', async () => {
      const listener = sinon.stub()

      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = null

      // @ts-expect-error - accessing non-existent property
      studioLifecycleManager.studioReady = true

      studioLifecycleManager.registerStudioReadyListener(listener)

      // Give enough time for any promises to resolve
      await Promise.resolve()
      await Promise.resolve()
      await nextTick()

      expect(listener).not.to.be.called
    })

    it('adds multiple listeners to the list', () => {
      const listener1 = sinon.stub()
      const listener2 = sinon.stub()

      studioLifecycleManager.registerStudioReadyListener(listener1)
      studioLifecycleManager.registerStudioReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).to.include(listener1)
      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).to.include(listener2)
    })

    it('cleans up listeners after calling them when studio becomes ready', async () => {
      const listener1 = sinon.stub()
      const listener2 = sinon.stub()

      studioLifecycleManager.registerStudioReadyListener(listener1)
      studioLifecycleManager.registerStudioReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).to.equal(2)

      const listenersCalledPromise = Promise.all([
        new Promise<void>((resolve) => {
          listener1.callsFake(() => resolve())
        }),
        new Promise<void>((resolve) => {
          listener2.callsFake(() => resolve())
        }),
      ])

      studioLifecycleManager.initializeStudioManager({
        projectId: 'test-project-id',
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      await listenersCalledPromise

      await nextTick()

      expect(listener1).to.be.calledWith(mockStudioManager)
      expect(listener2).to.be.calledWith(mockStudioManager)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).to.equal(0)
    })
  })

  describe('status tracking', () => {
    it('updates status and emits events when status changes', async () => {
      // Setup the context to test status updates
      // @ts-expect-error - accessing private property
      studioLifecycleManager.ctx = mockCtx

      studioLifecycleManager.updateStatus('INITIALIZING')

      // Wait for nextTick to process
      await nextTick()

      expect(studioStatusChangeEmitterStub).to.be.calledOnce

      // Same status should not trigger another event
      studioStatusChangeEmitterStub.reset()
      studioLifecycleManager.updateStatus('INITIALIZING')

      await nextTick()
      expect(studioStatusChangeEmitterStub).not.to.be.called

      // Different status should trigger another event
      studioStatusChangeEmitterStub.reset()
      studioLifecycleManager.updateStatus('ENABLED')

      await nextTick()
      expect(studioStatusChangeEmitterStub).to.be.calledOnce
    })

    it('updates status when getStudio is called', async () => {
      // @ts-expect-error - accessing private property
      studioLifecycleManager.ctx = mockCtx
      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)

      const updateStatusSpy = sinon.spy(studioLifecycleManager as any, 'updateStatus')

      const result = await studioLifecycleManager.getStudio()

      expect(result).to.equal(mockStudioManager)
      expect(updateStatusSpy).to.be.calledWith('INITIALIZED')
    })

    it('handles status updates properly during initialization', async () => {
      const statusChangesSpy = sinon.spy(studioLifecycleManager as any, 'updateStatus')

      studioLifecycleManager.initializeStudioManager({
        projectId: 'test-project-id',
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      // Should set INITIALIZING status immediately
      expect(statusChangesSpy).to.be.calledWith('INITIALIZING')

      const studioReadyPromise = new Promise((resolve) => {
        studioLifecycleManager?.registerStudioReadyListener(() => {
          resolve(true)
        })
      })

      await studioReadyPromise

      expect(statusChangesSpy).to.be.calledWith('INITIALIZED')
    })

    it('updates status to IN_ERROR when initialization fails', async () => {
      getAndInitializeStudioManagerStub.rejects(new Error('Test error'))

      const statusChangesSpy = sinon.spy(studioLifecycleManager as any, 'updateStatus')

      studioLifecycleManager.initializeStudioManager({
        projectId: 'test-project-id',
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      expect(statusChangesSpy).to.be.calledWith('INITIALIZING')

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(statusChangesSpy).to.be.calledWith('IN_ERROR')
    })
  })
})
