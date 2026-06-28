import { proxyquire } from '../../../spec_helper'
import sinon from 'sinon'
import { expect } from 'chai'
import { StudioManager } from '../../../../lib/cloud/studio/studio'
import { StudioLifecycleManager } from '../../../../lib/cloud/studio/StudioLifecycleManager'
import type { DataContext } from '@packages/data-context'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import path from 'path'
import os from 'os'
import { CloudRequest } from '../../../../lib/cloud/api/cloud_request'
import { isRetryableError } from '../../../../lib/cloud/network/is_retryable_error'
import { asyncRetry } from '../../../../lib/util/async_retry'
import { Cfg } from '../../../../lib/project-base'
import ProtocolManager from '../../../../lib/cloud/protocol'
import * as reportStudioErrorPath from '../../../../lib/cloud/api/studio/report_studio_error'

import { INITIALIZATION_TELEMETRY_GROUP_NAMES } from '../../../../lib/cloud/studio/telemetry/constants/initialization'
import { BUNDLE_LIFECYCLE_MARK_NAMES, BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES } from '../../../../lib/cloud/studio/telemetry/constants/bundle-lifecycle'
const api = require('../../../../lib/cloud/api').default

// Helper to wait for next tick in event loop
const nextTick = () => new Promise((resolve) => process.nextTick(resolve))

const debugData = { filePreprocessorHandlerText: 'handler text' }

describe('StudioLifecycleManager', () => {
  let studioLifecycleManager: StudioLifecycleManager
  let mockStudioManager: StudioManager
  let mockCtx: DataContext
  let mockCloudDataSource: CloudDataSource
  let StudioLifecycleManager: typeof import('../../../../lib/cloud/studio/StudioLifecycleManager').StudioLifecycleManager
  let postStudioSessionStub: sinon.SinonStub
  let studioStatusChangeEmitterStub: sinon.SinonStub
  let ensureStudioBundleStub: sinon.SinonStub
  let studioManagerSetupStub: sinon.SinonStub = sinon.stub()
  let readFileStub: sinon.SinonStub = sinon.stub()
  let mockCfg: Cfg
  let prepareProtocolStub: sinon.SinonStub
  let reportStudioErrorStub: sinon.SinonStub
  let getCaptureProtocolScriptStub: sinon.SinonStub
  let watcherStub: sinon.SinonStub
  let watcherOnStub: sinon.SinonStub
  let watcherCloseStub: sinon.SinonStub
  let studioManagerDestroyStub: sinon.SinonStub
  let addGroupMetadataStub: sinon.SinonStub
  let markStub: sinon.SinonStub
  let initializeTelemetryReporterStub: sinon.SinonStub
  let reportTelemetryStub: sinon.SinonStub
  const mockContents = 'console.log("studio script")'

  beforeEach(() => {
    postStudioSessionStub = sinon.stub()
    studioManagerSetupStub = sinon.stub()
    ensureStudioBundleStub = sinon.stub()
    studioStatusChangeEmitterStub = sinon.stub()
    prepareProtocolStub = sinon.stub()
    reportStudioErrorStub = sinon.stub()
    getCaptureProtocolScriptStub = sinon.stub()
    watcherStub = sinon.stub()
    watcherOnStub = sinon.stub()
    watcherCloseStub = sinon.stub()
    studioManagerDestroyStub = sinon.stub()
    addGroupMetadataStub = sinon.stub()
    markStub = sinon.stub()
    initializeTelemetryReporterStub = sinon.stub()
    mockStudioManager = {
      status: 'ENABLED',
      setup: studioManagerSetupStub.resolves(),
      destroy: studioManagerDestroyStub.resolves(),
    } as unknown as StudioManager

    readFileStub = sinon.stub()
    reportTelemetryStub = sinon.stub()

    StudioLifecycleManager = proxyquire('../lib/cloud/studio/StudioLifecycleManager', {
      './ensure_studio_bundle': {
        ensureStudioBundle: ensureStudioBundleStub,
      },
      '../api/studio/post_studio_session': {
        postStudioSession: postStudioSessionStub,
      },
      './studio': {
        StudioManager: class StudioManager {
          constructor () {
            return mockStudioManager
          }
        },
      },
      'fs-extra': {
        readFile: readFileStub.resolves(mockContents),
      },
      '../get_cloud_metadata': {
        getCloudMetadata: sinon.stub().resolves({
          cloudUrl: 'https://cloud.cypress.io',
          cloudHeaders: { 'Authorization': 'Bearer test-token' },
        }),
      },
      'fs/promises': {
        readFile: readFileStub.resolves('console.log("studio script")'),
      },
      'chokidar': {
        watch: watcherStub.returns({
          on: watcherOnStub.returnsThis(),
          close: watcherCloseStub.resolves(),
          removeAllListeners: sinon.stub(),
        }),
      },
      '../routes': {
        apiUrl: 'http://localhost:1234/',
      },
      './telemetry/TelemetryManager': {
        telemetryManager: {
          mark: markStub,
          addGroupMetadata: addGroupMetadataStub,
        },
      },
      './telemetry/TelemetryReporter': {
        initializeTelemetryReporter: initializeTelemetryReporterStub,
        reportTelemetry: reportTelemetryStub,
      },
    }).StudioLifecycleManager

    studioLifecycleManager = new StudioLifecycleManager()

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
      actions: {
        auth: {
          authApi: {
            getUser: sinon.stub().resolves({
              authToken: 'test-token',
            }),
          },
        },
      },
      project: {
        getConfig: sinon.stub().resolves({
          projectId: 'abc123',
        }),
      },
    } as unknown as DataContext

    mockCloudDataSource = {
      getCloudUrl: sinon.stub().returns('https://cloud.cypress.io'),
      additionalHeaders: sinon.stub().resolves({ 'Authorization': 'Bearer test-token' }),
    } as unknown as CloudDataSource

    mockCfg = {
      projectId: 'abc123',
      testingType: 'e2e',
      projectRoot: '/test/project',
      port: 8888,
      proxyUrl: 'http://localhost:8888',
      devServerPublicPathRoute: '/__cypress/src',
      namespace: '__cypress',
    } as unknown as Cfg

    postStudioSessionStub.resolves({
      studioUrl: 'https://cloud.cypress.io/studio/bundle/abc.tgz',
      protocolUrl: 'https://cloud.cypress.io/capture-protocol/script/def.js',
    })

    getCaptureProtocolScriptStub = sinon.stub(api, 'getCaptureProtocolScript').resolves('console.log("hello")')
    prepareProtocolStub = sinon.stub(ProtocolManager.prototype, 'prepareProtocol').resolves()

    reportStudioErrorStub = sinon.stub(reportStudioErrorPath, 'reportStudioError').resolves()
  })

  afterEach(() => {
    sinon.restore()

    delete process.env.CYPRESS_LOCAL_STUDIO_PATH
  })

  describe('initializeStudioManager', () => {
    it('initializes the studio manager and registers it in the data context and sets up protocol when studio is enabled', async () => {
      studioManagerSetupStub.callsFake((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const studioReadyPromise = new Promise((resolve) => {
        studioLifecycleManager?.registerStudioReadyListener((studioManager) => {
          resolve(studioManager)
        })
      })

      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData,
      })

      await studioReadyPromise

      expect(mockCtx.update).to.be.calledOnce
      expect(ensureStudioBundleStub).to.be.calledWith({
        studioUrl: 'https://cloud.cypress.io/studio/bundle/abc.tgz',
        projectId: 'abc123',
      })

      expect(studioManagerSetupStub).to.be.calledWith({
        script: 'console.log("studio script")',
        studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc'),
        studioHash: 'abc',
        getProjectOptions: sinon.match.func,
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          cloudHeaders: { 'Authorization': 'Bearer test-token' },
          CloudRequest,
          isRetryableError,
          asyncRetry,
        },
        manifest: mockManifest,
        debugData,
      })

      expect(postStudioSessionStub).to.be.calledWith({
        projectId: 'abc123',
      })

      expect(readFileStub).to.be.calledWith(path.join(os.tmpdir(), 'cypress', 'studio', 'abc', 'server', 'index.js'), 'utf8')

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
        debugData,
        mode: 'studio',
      })

      expect(initializeTelemetryReporterStub).to.be.calledWith({
        projectSlug: 'abc123',
        cloudDataSource: mockCloudDataSource,
      })

      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_END)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_END)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_END)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_END)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_END)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_END)

      expect(reportTelemetryStub).to.be.calledWith(BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES.COMPLETE_BUNDLE_LIFECYCLE, {
        success: true,
      })
    })

    it('initializes the studio manager in watch mode when CYPRESS_LOCAL_STUDIO_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'

      studioManagerSetupStub.callsFake((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const studioReadyPromise = new Promise((resolve) => {
        studioLifecycleManager?.registerStudioReadyListener((studioManager) => {
          resolve(studioManager)
        })
      })

      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await studioReadyPromise

      expect(mockCtx.update).to.be.calledOnce
      expect(ensureStudioBundleStub).not.to.be.called

      expect(studioManagerSetupStub).to.be.calledWith({
        script: 'console.log("studio script")',
        studioPath: '/path/to/studio',
        studioHash: 'local',
        getProjectOptions: sinon.match.func,
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          cloudHeaders: { 'Authorization': 'Bearer test-token' },
          CloudRequest,
          isRetryableError,
          asyncRetry,
        },
        manifest: {},
        debugData: {},
      })

      expect(postStudioSessionStub).to.be.calledWith({
        projectId: 'abc123',
      })

      expect(readFileStub).to.be.calledWith(path.join('/path', 'to', 'studio', 'server', 'index.js'), 'utf8')

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

      expect(StudioLifecycleManager['watcher']).to.exist
      expect(watcherStub).to.be.calledWith(path.join('/path', 'to', 'studio', 'server', 'index.js'), {
        awaitWriteFinish: true,
      })

      expect(watcherOnStub).to.be.calledWith('change')

      const onCallback = watcherOnStub.args[0][1]

      let mockStudioManagerPromise: Promise<StudioManager>
      const updatedStudioManager = {
        status: 'ENABLED',
        destroy: studioManagerDestroyStub,
      } as unknown as StudioManager

      studioLifecycleManager['createStudioManager'] = sinon.stub().callsFake(() => {
        mockStudioManagerPromise = new Promise((resolve) => {
          resolve(updatedStudioManager)
        })

        return mockStudioManagerPromise
      })

      await onCallback()

      expect(studioManagerDestroyStub).to.be.called

      expect(mockStudioManagerPromise).to.exist
      expect(await mockStudioManagerPromise).to.equal(updatedStudioManager)
    })

    it('throws an error when the studio server script is not found in the manifest', async () => {
      studioManagerSetupStub.callsFake((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const reportErrorPromise = new Promise<void>((resolve) => {
        reportStudioErrorStub.callsFake((err) => {
          resolve()

          return undefined
        })
      })

      const mockManifest = {}

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await reportErrorPromise

      // @ts-expect-error - accessing private property
      const studioPromise = studioLifecycleManager.studioManagerPromise

      expect(studioPromise).to.not.be.null

      expect(reportStudioErrorStub).to.be.calledOnce
      expect(reportStudioErrorStub).to.be.calledWithMatch({
        cloudApi: sinon.match.object,
        studioHash: 'abc',
        projectSlug: 'abc123',
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Expected hash for studio server script not found in manifest')),
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      })
    })

    it('throws an error when the studio server script is wrong in the manifest', async () => {
      studioManagerSetupStub.callsFake((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const reportErrorPromise = new Promise<void>((resolve) => {
        reportStudioErrorStub.callsFake((err) => {
          resolve()

          return undefined
        })
      })

      const mockManifest = {
        'server/index.js': 'a1',
      }

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await reportErrorPromise

      // @ts-expect-error - accessing private property
      const studioPromise = studioLifecycleManager.studioManagerPromise

      expect(studioPromise).to.not.be.null

      expect(reportStudioErrorStub).to.be.calledOnce
      expect(reportStudioErrorStub).to.be.calledWithMatch({
        cloudApi: sinon.match.object,
        studioHash: 'abc',
        projectSlug: 'abc123',
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Invalid hash for studio server script')),
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      })
    })

    it('handles errors when initializing the studio manager and reports them', async () => {
      const error = new Error('Test error')
      const listener1 = sinon.stub()
      const listener2 = sinon.stub()

      studioLifecycleManager.registerStudioReadyListener(listener1)
      studioLifecycleManager.registerStudioReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).to.equal(2)

      ensureStudioBundleStub.rejects(error)

      const reportErrorPromise = new Promise<void>((resolve) => {
        reportStudioErrorStub.callsFake((err) => {
          resolve()

          return undefined
        })
      })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await reportErrorPromise

      expect(mockCtx.update).to.be.calledOnce

      // @ts-expect-error - accessing private property
      const studioPromise = studioLifecycleManager.studioManagerPromise

      expect(studioPromise).to.not.be.null

      expect(reportStudioErrorStub).to.be.calledOnce
      expect(reportStudioErrorStub).to.be.calledWithMatch({
        cloudApi: sinon.match.object,
        studioHash: 'abc',
        projectSlug: 'abc123',
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Test error')),
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      })

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).to.equal(2)

      expect(listener1).not.to.be.called
      expect(listener2).not.to.be.called

      if (studioPromise) {
        const result = await studioPromise

        expect(result).to.be.null
      }

      expect(initializeTelemetryReporterStub).to.be.calledWith({
        projectSlug: 'abc123',
        cloudDataSource: mockCloudDataSource,
      })

      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_END)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_START)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_END)
      expect(markStub).to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_START)
      expect(markStub).not.to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_END)
      expect(markStub).not.to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_START)
      expect(markStub).not.to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_END)
      expect(markStub).not.to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_START)
      expect(markStub).not.to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_END)
      expect(markStub).not.to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_START)
      expect(markStub).not.to.be.calledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_END)

      expect(reportTelemetryStub).to.be.calledWith(BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES.COMPLETE_BUNDLE_LIFECYCLE, {
        success: false,
      })
    })
  })

  describe('isStudioReady', () => {
    it('returns false when studio manager has not been initialized', () => {
      expect(studioLifecycleManager.isStudioReady()).to.be.false

      expect(addGroupMetadataStub).to.be.calledWith(INITIALIZATION_TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
        studioRequestedBeforeReady: true,
      })
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
    beforeEach(() => {
      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })
    })

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

      studioLifecycleManager.registerStudioReadyListener(listener)

      expect(listener).to.be.calledWith(mockStudioManager)
    })

    it('calls listener immediately and adds to the list of listeners when CYPRESS_LOCAL_STUDIO_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'

      const listener = sinon.stub()

      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = mockStudioManager

      // @ts-expect-error - accessing non-existent property
      studioLifecycleManager.studioReady = true

      studioLifecycleManager.registerStudioReadyListener(listener)

      expect(listener).to.be.calledWith(mockStudioManager)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).to.include(listener)
    })

    it('does not call listener if studio manager is null', async () => {
      const listener = sinon.stub()

      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = null

      // @ts-expect-error - accessing non-existent property
      studioLifecycleManager.studioReady = true

      studioLifecycleManager.registerStudioReadyListener(listener)

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

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await listenersCalledPromise

      expect(listener1).to.be.calledWith(mockStudioManager)
      expect(listener2).to.be.calledWith(mockStudioManager)

      // Listeners should be cleared after successful initialization
      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).to.equal(0)
    })
  })

  describe('status tracking', () => {
    beforeEach(() => {
      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })
    })

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
      expect(updateStatusSpy).to.be.calledWith('ENABLED')
    })

    it('handles status updates properly during initialization', async () => {
      const statusChangesSpy = sinon.spy(studioLifecycleManager as any, 'updateStatus')

      await studioLifecycleManager.initializeStudioManager({
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

      expect(statusChangesSpy).to.be.calledWith('ENABLED')
    })

    it('updates status to IN_ERROR when initialization fails', async () => {
      ensureStudioBundleStub.rejects(new Error('Test error'))

      const statusChangesSpy = sinon.spy(studioLifecycleManager as any, 'updateStatus')

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      expect(statusChangesSpy).to.be.calledWith('INITIALIZING')

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(statusChangesSpy).to.be.calledWith('IN_ERROR')
    })

    describe('updateStatus with error parameter', () => {
      it('stores error code from regular error', () => {
        const error = new Error('Test error') as any

        error.code = 'CERT_HAS_EXPIRED'

        studioLifecycleManager.updateStatus('IN_ERROR', error)

        expect(studioLifecycleManager.getCurrentStatus()).to.equal('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).to.equal('CERT_HAS_EXPIRED')
      })

      it('stores error code from AggregateError', () => {
        const error1 = new Error('First error') as any

        error1.code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
        const error2 = new Error('Second error') as any

        error2.code = 'DEPTH_ZERO_SELF_SIGNED_CERT'
        const aggregateError = new AggregateError([error1, error2], 'Multiple errors')

        studioLifecycleManager.updateStatus('IN_ERROR', aggregateError)

        expect(studioLifecycleManager.getCurrentStatus()).to.equal('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).to.equal('DEPTH_ZERO_SELF_SIGNED_CERT')
      })

      it('handles error without code', () => {
        const error = new Error('Test error without code')

        studioLifecycleManager.updateStatus('IN_ERROR', error)

        expect(studioLifecycleManager.getCurrentStatus()).to.equal('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).to.be.undefined
      })

      it('handles non-error parameter', () => {
        studioLifecycleManager.updateStatus('IN_ERROR', 'string error')

        expect(studioLifecycleManager.getCurrentStatus()).to.equal('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).to.be.undefined
      })

      it('emits status change event when error is provided', async () => {
        // @ts-expect-error - accessing private property
        studioLifecycleManager.ctx = mockCtx

        const error = new Error('Test error') as any

        error.code = 'CERT_HAS_EXPIRED'

        studioLifecycleManager.updateStatus('IN_ERROR', error)

        await nextTick()

        expect(studioStatusChangeEmitterStub).to.be.calledOnce
      })
    })
  })

  describe('getCurrentStatus', () => {
    it('returns undefined when no status has been set', () => {
      expect(studioLifecycleManager.getCurrentStatus()).to.be.undefined
    })

    it('returns the current status after it has been set', () => {
      studioLifecycleManager.updateStatus('INITIALIZING')
      expect(studioLifecycleManager.getCurrentStatus()).to.equal('INITIALIZING')

      studioLifecycleManager.updateStatus('ENABLED')
      expect(studioLifecycleManager.getCurrentStatus()).to.equal('ENABLED')

      studioLifecycleManager.updateStatus('IN_ERROR')
      expect(studioLifecycleManager.getCurrentStatus()).to.equal('IN_ERROR')
    })
  })

  describe('getIsCertError', () => {
    it('returns false when no error code is stored', () => {
      expect(studioLifecycleManager.getIsCertError()).to.be.false
    })

    it('returns false when error code is not a cert error', () => {
      const error = new Error('Test error') as any

      error.code = 'NETWORK_ERROR'

      studioLifecycleManager.updateStatus('IN_ERROR', error)

      expect(studioLifecycleManager.getIsCertError()).to.be.false
    })

    it('returns true for a cert error', () => {
      const error = new Error('Certificate error') as any

      error.code = 'SELF_SIGNED_CERT_IN_CHAIN'

      studioLifecycleManager.updateStatus('IN_ERROR', error)

      expect(studioLifecycleManager.getIsCertError()).to.be.true
    })

    it('returns true for cert error from AggregateError', () => {
      const error1 = new Error('First error') as any

      error1.code = 'NETWORK_ERROR'
      const error2 = new Error('Second error') as any

      error2.code = 'CERT_HAS_EXPIRED'
      const aggregateError = new AggregateError([error1, error2], 'Multiple errors')

      studioLifecycleManager.updateStatus('IN_ERROR', aggregateError)

      expect(studioLifecycleManager.getIsCertError()).to.be.true
    })

    it('returns false when status is not IN_ERROR', () => {
      const error = new Error('Certificate error') as any

      error.code = 'CERT_HAS_EXPIRED'

      studioLifecycleManager.updateStatus('INITIALIZING', error)

      expect(studioLifecycleManager.getIsCertError()).to.be.false
    })
  })

  describe('retry', () => {
    it('clears state and re-initializes studio manager', async () => {
      // Cloud studio is enabled
      studioManagerSetupStub.callsFake((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      // First initialize with some state
      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      // Wait for initialization to complete
      await new Promise((resolve) => {
        studioLifecycleManager.registerStudioReadyListener(() => {
          resolve(true)
        })
      })

      // Initial state
      expect(studioLifecycleManager.getCurrentStatus()).to.equal('ENABLED')
      expect(studioLifecycleManager.isStudioReady()).to.be.true

      const initialCallCount = postStudioSessionStub.callCount

      await studioLifecycleManager.retry()

      // Verify state was cleared
      expect(studioLifecycleManager.getCurrentStatus()).to.equal('INITIALIZING')
      expect(studioLifecycleManager.isStudioReady()).to.be.false

      // Wait for retry initialization to complete by waiting for the promise to resolve
      // @ts-expect-error - accessing private property
      const retryPromise = studioLifecycleManager.studioManagerPromise

      await retryPromise

      // Verify retry worked
      expect(studioLifecycleManager.getCurrentStatus()).to.equal('ENABLED')
      expect(studioLifecycleManager.isStudioReady()).to.be.true

      // Verify initialization was called again (should be initial + 1 more for retry)
      expect(postStudioSessionStub.callCount).to.equal(initialCallCount + 1)
      expect(studioManagerSetupStub.callCount).to.equal(initialCallCount + 1)
      expect(ensureStudioBundleStub.callCount).to.equal(initialCallCount + 1)
    })

    it('sets status to IN_ERROR when no initialization parameters are available', async () => {
      // Set up ctx so retry doesn't return early
      // @ts-expect-error - accessing private property
      studioLifecycleManager.ctx = mockCtx

      // Don't initialize first, so no params are stored
      await studioLifecycleManager.retry()

      expect(studioLifecycleManager.getCurrentStatus()).to.equal('IN_ERROR')
    })

    it('does nothing when no ctx is available', async () => {
      const statusChangesSpy = sinon.spy(studioLifecycleManager as any, 'updateStatus')

      // Call retry without ctx
      await studioLifecycleManager.retry()

      // Should not have updated status
      expect(statusChangesSpy).not.to.be.called
    })

    it('clears the current studio hash from cached bundle promises on retry', async () => {
      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.resolves({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      // Add some cached promises to the static map
      const dummyPromise = Promise.resolve({
        manifest: {
          'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
        },
        studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc'),
      })

      // @ts-expect-error - accessing private static property
      StudioLifecycleManager.hashLoadingMap.set('test-hash-1', dummyPromise)
      // @ts-expect-error - accessing private static property
      StudioLifecycleManager.hashLoadingMap.set('abc', dummyPromise) // This should be the current hash (from studioUrl)

      // Initialize with ctx so retry will work
      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.size).to.equal(2)

      // Wait for initialization to complete
      await new Promise((resolve) => {
        studioLifecycleManager.registerStudioReadyListener(() => {
          resolve(true)
        })
      })

      await studioLifecycleManager.retry()

      // Verify only the current studio hash was cleared (abc from the studioUrl)
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.has('test-hash-1')).to.be.true
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.has('abc')).to.be.false
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.size).to.equal(1)

      // Wait for retry to complete
      await new Promise((resolve) => {
        studioLifecycleManager.registerStudioReadyListener(() => {
          resolve(true)
        })
      })
    })

    it('clears the local hash when using local studio path', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'

      // Add some cached promises to the static map, including 'local' hash
      const dummyPromise = Promise.resolve()

      // @ts-expect-error - accessing private static property
      StudioLifecycleManager.hashLoadingMap.set('test-hash-1', dummyPromise)
      // @ts-expect-error - accessing private static property
      StudioLifecycleManager.hashLoadingMap.set('local', dummyPromise) // This should be cleared

      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.size).to.equal(2)

      // Initialize with ctx so retry will work
      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      // Wait for initialization to complete
      await new Promise((resolve) => {
        studioLifecycleManager.registerStudioReadyListener(() => {
          resolve(true)
        })
      })

      await studioLifecycleManager.retry()

      // Wait for retry to complete
      await new Promise((resolve) => {
        studioLifecycleManager.registerStudioReadyListener(() => {
          resolve(true)
        })
      })

      // Verify only the 'local' hash was cleared
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.has('test-hash-1')).to.be.true
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.has('local')).to.be.false
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.size).to.equal(1)
    })
  })
})
