import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createRequire } from 'module'
import type { StudioManager } from '../../../../lib/cloud/studio/studio'
import type { StudioLifecycleManager } from '../../../../lib/cloud/studio/StudioLifecycleManager'
import type { DataContext } from '@packages/data-context'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import path from 'path'
import os from 'os'
import type { Cfg } from '../../../../lib/project-base'

import { INITIALIZATION_TELEMETRY_GROUP_NAMES } from '../../../../lib/cloud/studio/telemetry/constants/initialization'
import { BUNDLE_LIFECYCLE_MARK_NAMES, BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES } from '../../../../lib/cloud/studio/telemetry/constants/bundle-lifecycle'

const state = vi.hoisted(() => {
  return {} as {
    mockStudioManager: StudioManager
    ensureStudioBundle: Mock
    postStudioSession: Mock
    readFile: Mock
    getCloudMetadata: Mock
    watch: Mock
    mark: Mock
    addGroupMetadata: Mock
    initializeTelemetryReporter: Mock
    reportTelemetry: Mock
  }
})

vi.mock('../../../../lib/cloud/studio/ensure_studio_bundle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/studio/ensure_studio_bundle')>()

  return { ...actual, ensureStudioBundle: (...args: unknown[]) => state.ensureStudioBundle(...args) }
})

vi.mock('../../../../lib/cloud/api/studio/post_studio_session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/api/studio/post_studio_session')>()

  return { ...actual, postStudioSession: (...args: unknown[]) => state.postStudioSession(...args) }
})

vi.mock('../../../../lib/cloud/studio/studio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/studio/studio')>()

  return {
    ...actual,
    StudioManager: class StudioManager {
      constructor () {
        return state.mockStudioManager
      }
    },
  }
})

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  const readFile = (...args: unknown[]) => state.readFile(...args)

  return { ...actual, readFile, default: { ...actual, readFile } }
})

vi.mock('../../../../lib/cloud/get_cloud_metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/get_cloud_metadata')>()

  return { ...actual, getCloudMetadata: (...args: unknown[]) => state.getCloudMetadata(...args) }
})

vi.mock('chokidar', async (importOriginal) => {
  const actual = await importOriginal<any>()
  const watch = (...args: unknown[]) => state.watch(...args)

  return { ...actual, watch, default: { ...actual.default, watch } }
})

vi.mock('../../../../lib/cloud/studio/telemetry/TelemetryManager', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/studio/telemetry/TelemetryManager')>()

  return {
    ...actual,
    telemetryManager: {
      mark: (...args: unknown[]) => state.mark(...args),
      addGroupMetadata: (...args: unknown[]) => state.addGroupMetadata(...args),
    },
  }
})

vi.mock('../../../../lib/cloud/studio/telemetry/TelemetryReporter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/studio/telemetry/TelemetryReporter')>()

  return {
    ...actual,
    initializeTelemetryReporter: (...args: unknown[]) => state.initializeTelemetryReporter(...args),
    reportTelemetry: (...args: unknown[]) => state.reportTelemetry(...args),
  }
})

// StudioLifecycleManager reaches routes through a CJS `require`, which `vi.mock` never sees
const requireCjs = createRequire(import.meta.url)
const routesPath = requireCjs.resolve('../../../../lib/cloud/routes.ts')

const actualRoutes = await vi.importActual<typeof import('../../../../lib/cloud/routes')>('../../../../lib/cloud/routes')

requireCjs.cache[routesPath] = {
  exports: { ...actualRoutes, getApiUrl: () => 'http://localhost:1234/' },
} as NodeModule

// Helper to wait for next tick in event loop
const nextTick = () => new Promise((resolve) => process.nextTick(resolve))

const debugData = { filePreprocessorHandlerText: 'handler text' }

const expectReportedStudioError = (stub: Mock, fields: Record<string, unknown>, message: string) => {
  const [options] = stub.mock.calls[0]

  expect(options).toMatchObject(fields)
  expect(options.error).toBeInstanceOf(Error)
  expect(options.error.message).toBe(message)
}

describe('StudioLifecycleManager', () => {
  let studioLifecycleManager: StudioLifecycleManager
  let mockStudioManager: StudioManager
  let mockCtx: DataContext
  let mockCloudDataSource: CloudDataSource
  let StudioLifecycleManager: typeof import('../../../../lib/cloud/studio/StudioLifecycleManager').StudioLifecycleManager
  let api: typeof import('../../../../lib/cloud/api').default
  let CloudRequest: typeof import('../../../../lib/cloud/api/cloud_request').CloudRequest
  let isRetryableError: typeof import('../../../../lib/cloud/network/is_retryable_error').isRetryableError
  let asyncRetry: typeof import('../../../../lib/util/async_retry').asyncRetry
  let GracefulExit: typeof import('../../../../lib/util/graceful-exit').GracefulExit
  let postStudioSessionStub: Mock
  let studioStatusChangeEmitterStub: Mock
  let ensureStudioBundleStub: Mock
  let studioManagerSetupStub: Mock
  let readFileStub: Mock
  let mockCfg: Cfg
  let prepareProtocolStub: Mock
  let reportStudioErrorStub: Mock
  let getCaptureProtocolScriptStub: Mock
  let watcherStub: Mock
  let watcherOnStub: Mock
  let watcherCloseStub: Mock
  let studioManagerDestroyStub: Mock
  let addGroupMetadataStub: Mock
  let markStub: Mock
  let initializeTelemetryReporterStub: Mock
  let reportTelemetryStub: Mock
  const mockContents = 'console.log("studio script")'

  beforeEach(async () => {
    postStudioSessionStub = vi.fn()
    studioManagerSetupStub = vi.fn()
    ensureStudioBundleStub = vi.fn()
    watcherStub = vi.fn()
    watcherOnStub = vi.fn()
    watcherCloseStub = vi.fn()
    studioManagerDestroyStub = vi.fn()
    addGroupMetadataStub = vi.fn()
    markStub = vi.fn()
    initializeTelemetryReporterStub = vi.fn()
    mockStudioManager = {
      status: 'ENABLED',
      setup: studioManagerSetupStub.mockResolvedValue(undefined),
      destroy: studioManagerDestroyStub.mockResolvedValue(undefined),
    } as unknown as StudioManager

    readFileStub = vi.fn().mockResolvedValue(mockContents)
    reportTelemetryStub = vi.fn()

    const watcher = {
      on: watcherOnStub.mockReturnThis(),
      close: watcherCloseStub.mockResolvedValue(undefined),
      removeAllListeners: vi.fn(),
    }

    watcherStub.mockReturnValue(watcher)

    Object.assign(state, {
      mockStudioManager,
      ensureStudioBundle: ensureStudioBundleStub,
      postStudioSession: postStudioSessionStub,
      readFile: readFileStub,
      getCloudMetadata: vi.fn().mockResolvedValue({
        cloudUrl: 'https://cloud.cypress.io',
        cloudHeaders: { 'Authorization': 'Bearer test-token' },
      }),
      watch: watcherStub,
      mark: markStub,
      addGroupMetadata: addGroupMetadataStub,
      initializeTelemetryReporter: initializeTelemetryReporterStub,
      reportTelemetry: reportTelemetryStub,
    })

    // StudioLifecycleManager keeps the bundle cache and watcher in static fields; re-import for fresh ones per test
    vi.resetModules()
    StudioLifecycleManager = (await import('../../../../lib/cloud/studio/StudioLifecycleManager')).StudioLifecycleManager
    api = (await import('../../../../lib/cloud/api')).default
    CloudRequest = (await import('../../../../lib/cloud/api/cloud_request')).CloudRequest
    isRetryableError = (await import('../../../../lib/cloud/network/is_retryable_error')).isRetryableError
    asyncRetry = (await import('../../../../lib/util/async_retry')).asyncRetry
    GracefulExit = (await import('../../../../lib/util/graceful-exit')).GracefulExit
    const { default: ProtocolManager } = await import('../../../../lib/cloud/protocol')
    const reportStudioErrorPath = await import('../../../../lib/cloud/api/studio/report_studio_error')

    studioLifecycleManager = new StudioLifecycleManager()

    studioStatusChangeEmitterStub = vi.fn()

    mockCtx = {
      update: vi.fn(),
      coreData: {},
      cloud: {
        getCloudUrl: vi.fn().mockReturnValue('https://cloud.cypress.io'),
        additionalHeaders: vi.fn().mockResolvedValue({ 'Authorization': 'Bearer test-token' }),
      },
      emitter: {
        studioStatusChange: studioStatusChangeEmitterStub,
      },
      actions: {
        auth: {
          authApi: {
            getUser: vi.fn().mockResolvedValue({
              authToken: 'test-token',
            }),
          },
        },
      },
      project: {
        getConfig: vi.fn().mockResolvedValue({
          projectId: 'abc123',
        }),
      },
    } as unknown as DataContext

    mockCloudDataSource = {
      getCloudUrl: vi.fn().mockReturnValue('https://cloud.cypress.io'),
      additionalHeaders: vi.fn().mockResolvedValue({ 'Authorization': 'Bearer test-token' }),
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

    postStudioSessionStub.mockResolvedValue({
      studioUrl: 'https://cloud.cypress.io/studio/bundle/abc.tgz',
      protocolUrl: 'https://cloud.cypress.io/capture-protocol/script/def.js',
    })

    getCaptureProtocolScriptStub = vi.spyOn(api, 'getCaptureProtocolScript').mockResolvedValue('console.log("hello")') as Mock
    prepareProtocolStub = vi.spyOn(ProtocolManager.prototype, 'prepareProtocol').mockResolvedValue(undefined) as Mock

    reportStudioErrorStub = vi.spyOn(reportStudioErrorPath, 'reportStudioError').mockResolvedValue(undefined) as Mock
  })

  afterEach(() => {
    vi.restoreAllMocks()

    globalThis.IS_TEST = true
    GracefulExit.resetForTesting()

    delete process.env.CYPRESS_LOCAL_STUDIO_PATH
  })

  afterAll(() => {
    delete requireCjs.cache[routesPath]
  })

  describe('initializeStudioManager', () => {
    it('initializes the studio manager and registers it in the data context and sets up protocol when studio is enabled', async () => {
      studioManagerSetupStub.mockImplementation((args) => {
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

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData,
      })

      await studioReadyPromise

      expect(mockCtx.update).toHaveBeenCalledOnce()
      expect(ensureStudioBundleStub).toHaveBeenCalledWith({
        studioUrl: 'https://cloud.cypress.io/studio/bundle/abc.tgz',
        projectId: 'abc123',
      })

      expect(studioManagerSetupStub).toHaveBeenCalledWith({
        script: 'console.log("studio script")',
        studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc'),
        studioHash: 'abc',
        getProjectOptions: expect.any(Function),
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

      expect(postStudioSessionStub).toHaveBeenCalledWith({
        projectId: 'abc123',
      })

      expect(readFileStub).toHaveBeenCalledWith(path.join(os.tmpdir(), 'cypress', 'studio', 'abc', 'server', 'index.js'), 'utf8')

      expect(getCaptureProtocolScriptStub).toHaveBeenCalledWith('https://cloud.cypress.io/capture-protocol/script/def.js', { displayRetryErrors: false })
      expect(prepareProtocolStub).toHaveBeenCalledWith('console.log("hello")', {
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

      expect(initializeTelemetryReporterStub).toHaveBeenCalledWith({
        projectSlug: 'abc123',
        cloudDataSource: mockCloudDataSource,
      })

      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_END)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_END)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_END)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_END)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_END)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_END)

      expect(reportTelemetryStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES.COMPLETE_BUNDLE_LIFECYCLE, {
        success: true,
      })
    })

    it('initializes the studio manager in watch mode when CYPRESS_LOCAL_STUDIO_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'

      studioManagerSetupStub.mockImplementation((args) => {
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

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await studioReadyPromise

      expect(mockCtx.update).toHaveBeenCalledOnce()
      expect(ensureStudioBundleStub).not.toHaveBeenCalled()

      expect(studioManagerSetupStub).toHaveBeenCalledWith({
        script: 'console.log("studio script")',
        studioPath: '/path/to/studio',
        studioHash: 'local',
        getProjectOptions: expect.any(Function),
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

      expect(postStudioSessionStub).toHaveBeenCalledWith({
        projectId: 'abc123',
      })

      expect(readFileStub).toHaveBeenCalledWith(path.join('/path', 'to', 'studio', 'server', 'index.js'), 'utf8')

      expect(getCaptureProtocolScriptStub).toHaveBeenCalledWith('https://cloud.cypress.io/capture-protocol/script/def.js', { displayRetryErrors: false })
      expect(prepareProtocolStub).toHaveBeenCalledWith('console.log("hello")', {
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

      expect(StudioLifecycleManager['watcher']).toBeDefined()
      expect(StudioLifecycleManager['watcher']).not.toBeNull()
      expect(watcherStub).toHaveBeenCalledWith(path.join('/path', 'to', 'studio', 'server', 'index.js'), {
        awaitWriteFinish: true,
      })

      expect(watcherOnStub).toHaveBeenCalledWith('change', expect.any(Function))

      const onCallback = watcherOnStub.mock.calls[0][1]

      let mockStudioManagerPromise: Promise<StudioManager>
      const updatedStudioManager = {
        status: 'ENABLED',
        destroy: studioManagerDestroyStub,
      } as unknown as StudioManager

      studioLifecycleManager['createStudioManager'] = vi.fn().mockImplementation(() => {
        mockStudioManagerPromise = new Promise((resolve) => {
          resolve(updatedStudioManager)
        })

        return mockStudioManagerPromise
      })

      await onCallback()

      expect(studioManagerDestroyStub).toHaveBeenCalled()

      expect(mockStudioManagerPromise).toBeDefined()
      expect(mockStudioManagerPromise).not.toBeNull()
      expect(await mockStudioManagerPromise).toBe(updatedStudioManager)
    })

    it('throws an error when the studio server script is not found in the manifest', async () => {
      studioManagerSetupStub.mockImplementation((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const reportErrorPromise = new Promise<void>((resolve) => {
        reportStudioErrorStub.mockImplementation((err) => {
          resolve()

          return undefined
        })
      })

      const mockManifest = {}

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await reportErrorPromise

      // @ts-expect-error - accessing private property
      const studioPromise = studioLifecycleManager.studioManagerPromise

      expect(studioPromise).not.toBeNull()

      expect(reportStudioErrorStub).toHaveBeenCalledOnce()
      expectReportedStudioError(reportStudioErrorStub, {
        cloudApi: expect.any(Object),
        studioHash: 'abc',
        projectSlug: 'abc123',
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      }, 'Expected hash for studio server script not found in manifest')
    })

    it('throws an error when the studio server script is wrong in the manifest', async () => {
      studioManagerSetupStub.mockImplementation((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const reportErrorPromise = new Promise<void>((resolve) => {
        reportStudioErrorStub.mockImplementation((err) => {
          resolve()

          return undefined
        })
      })

      const mockManifest = {
        'server/index.js': 'a1',
      }

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await reportErrorPromise

      // @ts-expect-error - accessing private property
      const studioPromise = studioLifecycleManager.studioManagerPromise

      expect(studioPromise).not.toBeNull()

      expect(reportStudioErrorStub).toHaveBeenCalledOnce()
      expectReportedStudioError(reportStudioErrorStub, {
        cloudApi: expect.any(Object),
        studioHash: 'abc',
        projectSlug: 'abc123',
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      }, 'Invalid hash for studio server script')
    })

    it('handles errors when initializing the studio manager and reports them', async () => {
      const error = new Error('Test error')
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      studioLifecycleManager.registerStudioReadyListener(listener1)
      studioLifecycleManager.registerStudioReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).toBe(2)

      ensureStudioBundleStub.mockRejectedValue(error)

      const reportErrorPromise = new Promise<void>((resolve) => {
        reportStudioErrorStub.mockImplementation((err) => {
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

      expect(mockCtx.update).toHaveBeenCalledOnce()

      // @ts-expect-error - accessing private property
      const studioPromise = studioLifecycleManager.studioManagerPromise

      expect(studioPromise).not.toBeNull()

      expect(reportStudioErrorStub).toHaveBeenCalledOnce()
      expectReportedStudioError(reportStudioErrorStub, {
        cloudApi: expect.any(Object),
        studioHash: 'abc',
        projectSlug: 'abc123',
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      }, 'Test error')

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).toBe(2)

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()

      if (studioPromise) {
        const result = await studioPromise

        expect(result).toBeNull()
      }

      expect(initializeTelemetryReporterStub).toHaveBeenCalledWith({
        projectSlug: 'abc123',
        cloudDataSource: mockCloudDataSource,
      })

      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_END)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_START)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_END)
      expect(markStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_START)
      expect(markStub).not.toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_END)
      expect(markStub).not.toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_START)
      expect(markStub).not.toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_END)
      expect(markStub).not.toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_START)
      expect(markStub).not.toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_END)
      expect(markStub).not.toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_START)
      expect(markStub).not.toHaveBeenCalledWith(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_END)

      expect(reportTelemetryStub).toHaveBeenCalledWith(BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES.COMPLETE_BUNDLE_LIFECYCLE, {
        success: false,
      })
    })
  })

  describe('isStudioReady', () => {
    it('returns false when studio manager has not been initialized', () => {
      expect(studioLifecycleManager.isStudioReady()).toBe(false)

      expect(addGroupMetadataStub).toHaveBeenCalledWith(INITIALIZATION_TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
        studioRequestedBeforeReady: true,
      })
    })

    it('returns true when studio has been initialized', async () => {
      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = mockStudioManager

      expect(studioLifecycleManager.isStudioReady()).toBe(true)
    })
  })

  describe('getStudio', () => {
    it('throws an error when studio manager is not initialized', async () => {
      try {
        await studioLifecycleManager.getStudio()
        expect.unreachable('Expected method to throw')
      } catch (error) {
        expect(error.message).toBe('Studio manager has not been initialized')
      }
    })

    it('returns the studio manager when initialized', async () => {
      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)

      const result = await studioLifecycleManager.getStudio()

      expect(result).toBe(mockStudioManager)
    })
  })

  describe('registerStudioReadyListener', () => {
    beforeEach(() => {
      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })
    })

    it('registers a listener that will be called when studio is ready', () => {
      const listener = vi.fn()

      studioLifecycleManager.registerStudioReadyListener(listener)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).toContain(listener)
    })

    it('calls listener immediately if studio is already ready', async () => {
      const listener = vi.fn()

      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = mockStudioManager

      // @ts-expect-error - accessing non-existent property
      studioLifecycleManager.studioReady = true

      studioLifecycleManager.registerStudioReadyListener(listener)

      expect(listener).toHaveBeenCalledWith(mockStudioManager)
    })

    it('calls listener immediately and adds to the list of listeners when CYPRESS_LOCAL_STUDIO_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'

      const listener = vi.fn()

      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = mockStudioManager

      // @ts-expect-error - accessing non-existent property
      studioLifecycleManager.studioReady = true

      studioLifecycleManager.registerStudioReadyListener(listener)

      expect(listener).toHaveBeenCalledWith(mockStudioManager)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).toContain(listener)
    })

    it('does not call listener if studio manager is null', async () => {
      const listener = vi.fn()

      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManager = null

      // @ts-expect-error - accessing non-existent property
      studioLifecycleManager.studioReady = true

      studioLifecycleManager.registerStudioReadyListener(listener)

      expect(listener).not.toHaveBeenCalled()
    })

    it('adds multiple listeners to the list', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      studioLifecycleManager.registerStudioReadyListener(listener1)
      studioLifecycleManager.registerStudioReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).toContain(listener1)
      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners).toContain(listener2)
    })

    it('cleans up listeners after calling them when studio becomes ready', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      studioLifecycleManager.registerStudioReadyListener(listener1)
      studioLifecycleManager.registerStudioReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).toBe(2)

      const listenersCalledPromise = Promise.all([
        new Promise<void>((resolve) => {
          listener1.mockImplementation(() => resolve())
        }),
        new Promise<void>((resolve) => {
          listener2.mockImplementation(() => resolve())
        }),
      ])

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        cfg: mockCfg,
        debugData: {},
      })

      await listenersCalledPromise

      expect(listener1).toHaveBeenCalledWith(mockStudioManager)
      expect(listener2).toHaveBeenCalledWith(mockStudioManager)

      // Listeners should be cleared after successful initialization
      // @ts-expect-error - accessing private property
      expect(studioLifecycleManager.listeners.length).toBe(0)
    })
  })

  describe('status tracking', () => {
    beforeEach(() => {
      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })
    })

    it('updates status and emits events when status changes', async () => {
      // Setup the context to test status updates
      // @ts-expect-error - accessing private property
      studioLifecycleManager.ctx = mockCtx

      studioLifecycleManager.updateStatus('INITIALIZING')

      // Wait for nextTick to process
      await nextTick()

      expect(studioStatusChangeEmitterStub).toHaveBeenCalledOnce()

      // Same status should not trigger another event
      studioStatusChangeEmitterStub.mockClear()
      studioLifecycleManager.updateStatus('INITIALIZING')

      await nextTick()
      expect(studioStatusChangeEmitterStub).not.toHaveBeenCalled()

      // Different status should trigger another event
      studioStatusChangeEmitterStub.mockClear()
      studioLifecycleManager.updateStatus('ENABLED')

      await nextTick()
      expect(studioStatusChangeEmitterStub).toHaveBeenCalledOnce()
    })

    it('updates status when getStudio is called', async () => {
      // @ts-expect-error - accessing private property
      studioLifecycleManager.ctx = mockCtx
      // @ts-expect-error - accessing private property
      studioLifecycleManager.studioManagerPromise = Promise.resolve(mockStudioManager)

      const updateStatusSpy = vi.spyOn(studioLifecycleManager as any, 'updateStatus')

      const result = await studioLifecycleManager.getStudio()

      expect(result).toBe(mockStudioManager)
      expect(updateStatusSpy).toHaveBeenCalledWith('ENABLED')
    })

    it('handles status updates properly during initialization', async () => {
      const statusChangesSpy = vi.spyOn(studioLifecycleManager as any, 'updateStatus')

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      // Should set INITIALIZING status immediately
      expect(statusChangesSpy).toHaveBeenCalledWith('INITIALIZING')

      const studioReadyPromise = new Promise((resolve) => {
        studioLifecycleManager?.registerStudioReadyListener(() => {
          resolve(true)
        })
      })

      await studioReadyPromise

      expect(statusChangesSpy).toHaveBeenCalledWith('ENABLED')
    })

    it('updates status to IN_ERROR when initialization fails', async () => {
      ensureStudioBundleStub.mockRejectedValue(new Error('Test error'))

      const statusChangesSpy = vi.spyOn(studioLifecycleManager as any, 'updateStatus')

      await studioLifecycleManager.initializeStudioManager({
        cloudDataSource: mockCloudDataSource,
        cfg: mockCfg,
        debugData: {},
        ctx: mockCtx,
      })

      expect(statusChangesSpy).toHaveBeenCalledWith('INITIALIZING')

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(statusChangesSpy).toHaveBeenCalledWith('IN_ERROR', expect.objectContaining({ message: 'Test error' }))
    })

    describe('updateStatus with error parameter', () => {
      it('stores error code from regular error', () => {
        const error = new Error('Test error') as any

        error.code = 'CERT_HAS_EXPIRED'

        studioLifecycleManager.updateStatus('IN_ERROR', error)

        expect(studioLifecycleManager.getCurrentStatus()).toBe('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).toBe('CERT_HAS_EXPIRED')
      })

      it('stores error code from AggregateError', () => {
        const error1 = new Error('First error') as any

        error1.code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
        const error2 = new Error('Second error') as any

        error2.code = 'DEPTH_ZERO_SELF_SIGNED_CERT'
        const aggregateError = new AggregateError([error1, error2], 'Multiple errors')

        studioLifecycleManager.updateStatus('IN_ERROR', aggregateError)

        expect(studioLifecycleManager.getCurrentStatus()).toBe('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).toBe('DEPTH_ZERO_SELF_SIGNED_CERT')
      })

      it('handles error without code', () => {
        const error = new Error('Test error without code')

        studioLifecycleManager.updateStatus('IN_ERROR', error)

        expect(studioLifecycleManager.getCurrentStatus()).toBe('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).toBeUndefined()
      })

      it('handles non-error parameter', () => {
        studioLifecycleManager.updateStatus('IN_ERROR', 'string error')

        expect(studioLifecycleManager.getCurrentStatus()).toBe('IN_ERROR')
        // @ts-expect-error - accessing private property
        expect(studioLifecycleManager.lastErrorCode).toBeUndefined()
      })

      it('emits status change event when error is provided', async () => {
        // @ts-expect-error - accessing private property
        studioLifecycleManager.ctx = mockCtx

        const error = new Error('Test error') as any

        error.code = 'CERT_HAS_EXPIRED'

        studioLifecycleManager.updateStatus('IN_ERROR', error)

        await nextTick()

        expect(studioStatusChangeEmitterStub).toHaveBeenCalledOnce()
      })
    })
  })

  describe('getCurrentStatus', () => {
    it('returns undefined when no status has been set', () => {
      expect(studioLifecycleManager.getCurrentStatus()).toBeUndefined()
    })

    it('returns the current status after it has been set', () => {
      studioLifecycleManager.updateStatus('INITIALIZING')
      expect(studioLifecycleManager.getCurrentStatus()).toBe('INITIALIZING')

      studioLifecycleManager.updateStatus('ENABLED')
      expect(studioLifecycleManager.getCurrentStatus()).toBe('ENABLED')

      studioLifecycleManager.updateStatus('IN_ERROR')
      expect(studioLifecycleManager.getCurrentStatus()).toBe('IN_ERROR')
    })
  })

  describe('getIsCertError', () => {
    it('returns false when no error code is stored', () => {
      expect(studioLifecycleManager.getIsCertError()).toBe(false)
    })

    it('returns false when error code is not a cert error', () => {
      const error = new Error('Test error') as any

      error.code = 'NETWORK_ERROR'

      studioLifecycleManager.updateStatus('IN_ERROR', error)

      expect(studioLifecycleManager.getIsCertError()).toBe(false)
    })

    it('returns true for a cert error', () => {
      const error = new Error('Certificate error') as any

      error.code = 'SELF_SIGNED_CERT_IN_CHAIN'

      studioLifecycleManager.updateStatus('IN_ERROR', error)

      expect(studioLifecycleManager.getIsCertError()).toBe(true)
    })

    it('returns true for cert error from AggregateError', () => {
      const error1 = new Error('First error') as any

      error1.code = 'NETWORK_ERROR'
      const error2 = new Error('Second error') as any

      error2.code = 'CERT_HAS_EXPIRED'
      const aggregateError = new AggregateError([error1, error2], 'Multiple errors')

      studioLifecycleManager.updateStatus('IN_ERROR', aggregateError)

      expect(studioLifecycleManager.getIsCertError()).toBe(true)
    })

    it('returns false when status is not IN_ERROR', () => {
      const error = new Error('Certificate error') as any

      error.code = 'CERT_HAS_EXPIRED'

      studioLifecycleManager.updateStatus('INITIALIZING', error)

      expect(studioLifecycleManager.getIsCertError()).toBe(false)
    })
  })

  describe('retry', () => {
    it('clears state and re-initializes studio manager', async () => {
      // Cloud studio is enabled
      studioManagerSetupStub.mockImplementation((args) => {
        mockStudioManager.status = 'ENABLED'

        return Promise.resolve()
      })

      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

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
      expect(studioLifecycleManager.getCurrentStatus()).toBe('ENABLED')
      expect(studioLifecycleManager.isStudioReady()).toBe(true)

      const initialCallCount = postStudioSessionStub.mock.calls.length

      await studioLifecycleManager.retry()

      // Verify state was cleared
      expect(studioLifecycleManager.getCurrentStatus()).toBe('INITIALIZING')
      expect(studioLifecycleManager.isStudioReady()).toBe(false)

      // Wait for retry initialization to complete by waiting for the promise to resolve
      // @ts-expect-error - accessing private property
      const retryPromise = studioLifecycleManager.studioManagerPromise

      await retryPromise

      // Verify retry worked
      expect(studioLifecycleManager.getCurrentStatus()).toBe('ENABLED')
      expect(studioLifecycleManager.isStudioReady()).toBe(true)

      // Verify initialization was called again (should be initial + 1 more for retry)
      expect(postStudioSessionStub.mock.calls.length).toBe(initialCallCount + 1)
      expect(studioManagerSetupStub.mock.calls.length).toBe(initialCallCount + 1)
      expect(ensureStudioBundleStub.mock.calls.length).toBe(initialCallCount + 1)
    })

    it('sets status to IN_ERROR when no initialization parameters are available', async () => {
      // Set up ctx so retry doesn't return early
      // @ts-expect-error - accessing private property
      studioLifecycleManager.ctx = mockCtx

      // Don't initialize first, so no params are stored
      await studioLifecycleManager.retry()

      expect(studioLifecycleManager.getCurrentStatus()).toBe('IN_ERROR')
    })

    it('does nothing when no ctx is available', async () => {
      const statusChangesSpy = vi.spyOn(studioLifecycleManager as any, 'updateStatus')

      // Call retry without ctx
      await studioLifecycleManager.retry()

      // Should not have updated status
      expect(statusChangesSpy).not.toHaveBeenCalled()
    })

    it('clears the current studio hash from cached bundle promises on retry', async () => {
      const mockManifest = {
        'server/index.js': 'e1ed3dc8ba9eb8ece23914004b99ad97bba37e80a25d8b47c009e1e4948a6159',
      }

      ensureStudioBundleStub.mockResolvedValue({ manifest: mockManifest, studioPath: path.join(os.tmpdir(), 'cypress', 'studio', 'abc') })

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
      expect(StudioLifecycleManager.hashLoadingMap.size).toBe(2)

      // Wait for initialization to complete
      await new Promise((resolve) => {
        studioLifecycleManager.registerStudioReadyListener(() => {
          resolve(true)
        })
      })

      await studioLifecycleManager.retry()

      // Verify only the current studio hash was cleared (abc from the studioUrl)
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.has('test-hash-1')).toBe(true)
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.has('abc')).toBe(false)
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.size).toBe(1)

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
      expect(StudioLifecycleManager.hashLoadingMap.size).toBe(2)

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
      expect(StudioLifecycleManager.hashLoadingMap.has('test-hash-1')).toBe(true)
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.has('local')).toBe(false)
      // @ts-expect-error - accessing private static property
      expect(StudioLifecycleManager.hashLoadingMap.size).toBe(1)
    })
  })
})
