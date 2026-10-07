import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { CyPromptManager } from '../../../../lib/cloud/cy-prompt/CyPromptManager'
import type { CyPromptLifecycleManager } from '../../../../lib/cloud/cy-prompt/CyPromptLifecycleManager'
import type { DataContext } from '@packages/data-context'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import path from 'path'
import os from 'os'

const stubs = vi.hoisted(() => {
  return {
    ensureCyPromptBundle: undefined as unknown as Mock,
    postCyPromptSession: undefined as unknown as Mock,
    reportCyPromptError: undefined as unknown as Mock,
    readFile: undefined as unknown as Mock,
    watch: undefined as unknown as Mock,
    mockCyPromptManager: undefined as unknown,
  }
})

vi.mock('../../../../lib/cloud/cy-prompt/ensure_cy_prompt_bundle', () => ({ ensureCyPromptBundle: (...args) => stubs.ensureCyPromptBundle(...args) }))

vi.mock('../../../../lib/cloud/api/cy-prompt/post_cy_prompt_session', () => ({ postCyPromptSession: (...args) => stubs.postCyPromptSession(...args) }))

vi.mock('../../../../lib/cloud/api/cy-prompt/report_cy_prompt_error', () => ({ reportCyPromptError: (...args) => stubs.reportCyPromptError(...args) }))

vi.mock('../../../../lib/cloud/cy-prompt/CyPromptManager', () => {
  return {
    CyPromptManager: class CyPromptManager {
      constructor () {
        return stubs.mockCyPromptManager
      }
    },
  }
})

// Only the named export: the SUT imports `{ readFile }`, and other modules' default `fs-extra` stays real
vi.mock('fs-extra', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs-extra')>()

  return { ...actual, readFile: (...args) => stubs.readFile(...args) }
})

vi.mock('chokidar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('chokidar')>()
  const watch = (...args) => stubs.watch(...args)

  return { ...actual, watch, default: { ...actual, watch } }
})

describe('CyPromptLifecycleManager', () => {
  let cyPromptLifecycleManager: CyPromptLifecycleManager
  let mockCyPromptManager: CyPromptManager
  let mockCtx: DataContext
  let mockCloudDataSource: CloudDataSource
  let CyPromptLifecycleManager: typeof import('../../../../lib/cloud/cy-prompt/CyPromptLifecycleManager').CyPromptLifecycleManager
  let CloudRequest: typeof import('../../../../lib/cloud/api/cloud_request').CloudRequest
  let createCloudRequest: typeof import('../../../../lib/cloud/api/cloud_request').createCloudRequest
  let isRetryableError: typeof import('../../../../lib/cloud/network/is_retryable_error').isRetryableError
  let asyncRetry: typeof import('../../../../lib/util/async_retry').asyncRetry
  let GracefulExit: typeof import('../../../../lib/util/graceful-exit').GracefulExit
  let postCyPromptSessionStub: Mock
  let cyPromptStatusChangeEmitterStub: Mock
  let ensureCyPromptBundleStub: Mock
  let cyPromptManagerSetupStub: Mock
  let readFileStub: Mock
  let watcherStub: Mock
  let watcherOnStub: Mock
  let watcherCloseStub: Mock
  let reportCyPromptErrorStub: Mock
  const mockContents: string = 'console.log("cy-prompt script")'
  let originalIsTest: unknown

  beforeAll(() => {
    originalIsTest = (globalThis as any).IS_TEST
    Object.assign(globalThis, { IS_TEST: true })
  })

  afterAll(() => {
    Object.assign(globalThis, { IS_TEST: originalIsTest })
  })

  beforeEach(async () => {
    postCyPromptSessionStub = vi.fn()
    cyPromptManagerSetupStub = vi.fn().mockResolvedValue(undefined)
    ensureCyPromptBundleStub = vi.fn()
    cyPromptStatusChangeEmitterStub = vi.fn()
    mockCyPromptManager = {
      status: 'INITIALIZED',
      setup: cyPromptManagerSetupStub,
    } as unknown as CyPromptManager

    readFileStub = vi.fn().mockResolvedValue(mockContents)
    watcherCloseStub = vi.fn().mockResolvedValue(undefined)
    watcherOnStub = vi.fn(function (this: unknown) {
      return this
    })

    watcherStub = vi.fn(() => {
      return {
        on: watcherOnStub,
        close: watcherCloseStub,
        removeAllListeners: vi.fn(),
      }
    })

    reportCyPromptErrorStub = vi.fn().mockResolvedValue(undefined)

    stubs.ensureCyPromptBundle = ensureCyPromptBundleStub
    stubs.postCyPromptSession = postCyPromptSessionStub
    stubs.reportCyPromptError = reportCyPromptErrorStub
    stubs.readFile = readFileStub
    stubs.watch = watcherStub
    stubs.mockCyPromptManager = mockCyPromptManager

    // The SUT keeps static state (hashLoadingMap, watcher) that must start fresh for every test
    vi.resetModules()
    CyPromptLifecycleManager = (await import('../../../../lib/cloud/cy-prompt/CyPromptLifecycleManager')).CyPromptLifecycleManager
    const cloudRequest = await import('../../../../lib/cloud/api/cloud_request')

    CloudRequest = cloudRequest.CloudRequest
    createCloudRequest = cloudRequest.createCloudRequest
    isRetryableError = (await import('../../../../lib/cloud/network/is_retryable_error')).isRetryableError
    asyncRetry = (await import('../../../../lib/util/async_retry')).asyncRetry
    GracefulExit = (await import('../../../../lib/util/graceful-exit')).GracefulExit

    cyPromptLifecycleManager = new CyPromptLifecycleManager()

    cyPromptStatusChangeEmitterStub = vi.fn()

    mockCtx = {
      isOpenMode: false,
      update: vi.fn(),
      coreData: {
        currentRecordingInfo: {
          runId: 'test-run-id',
          instanceId: 'test-instance-id',
        },
      },
      cloud: {
        getCloudUrl: vi.fn(() => 'https://cloud.cypress.io'),
        additionalHeaders: vi.fn().mockResolvedValue({ 'Authorization': 'Bearer test-token' }),
      },
      emitter: {
        cyPromptStatusChange: cyPromptStatusChangeEmitterStub,
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
          projectId: 'test-project-id',
        }),
      },
    } as unknown as DataContext

    mockCloudDataSource = {
      getCloudUrl: vi.fn(() => 'https://cloud.cypress.io'),
      additionalHeaders: vi.fn().mockResolvedValue({ 'Authorization': 'Bearer test-token' }),
    } as unknown as CloudDataSource

    postCyPromptSessionStub.mockResolvedValue({
      cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    GracefulExit.resetForTesting()

    delete process.env.CYPRESS_LOCAL_CY_PROMPT_PATH
  })

  describe('initializeCyPromptManager', () => {
    it('initializes the cy-prompt manager and registers it in the data context', async () => {
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: true,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener(async (cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      const mockManifest = {
        'server/index.js': 'c3c4ab913ca059819549f105e756a4c4471df19abef884ce85eafc7b7970e7b4',
      }

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })

      await cyPromptReadyPromise

      expect(mockCtx.update).toHaveBeenCalledOnce()
      expect(ensureCyPromptBundleStub).toHaveBeenCalledWith({
        cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
        projectId: 'test-project-id',
      })

      expect(cyPromptManagerSetupStub).toHaveBeenCalledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptHash: 'abc',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: expect.any(Function),
        manifest: mockManifest,
      })

      const getProjectOptions = cyPromptManagerSetupStub.mock.calls[0][0].getProjectOptions
      const projectOptions = await getProjectOptions()

      expect(projectOptions).toEqual({
        isOpenMode: false,
        user: {
          authToken: 'test-token',
        },
        projectSlug: 'test-project-id',
        record: true,
        key: '123e4567-e89b-12d3-a456-426614174000',
        recordingInfo: {
          runId: 'test-run-id',
          instanceId: 'test-instance-id',
        },
      })

      expect(postCyPromptSessionStub).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      })

      expect(mockCloudDataSource.getCloudUrl).toHaveBeenCalledWith('test')
      expect(mockCloudDataSource.additionalHeaders).toHaveBeenCalled()
      expect(readFileStub).toHaveBeenCalledWith(path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc', 'server', 'index.js'), 'utf8')
    })

    it('handles errors when getUser fails but getProjectConfig succeeds', async () => {
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: true,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener(async (cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      const mockManifest = {
        'server/index.js': 'c3c4ab913ca059819549f105e756a4c4471df19abef884ce85eafc7b7970e7b4',
      }

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })

      await cyPromptReadyPromise

      expect(mockCtx.update).toHaveBeenCalledOnce()
      expect(ensureCyPromptBundleStub).toHaveBeenCalledWith({
        cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
        projectId: 'test-project-id',
      })

      expect(cyPromptManagerSetupStub).toHaveBeenCalledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptHash: 'abc',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: expect.any(Function),
        manifest: mockManifest,
      })

      expect(postCyPromptSessionStub).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      })

      expect(mockCloudDataSource.getCloudUrl).toHaveBeenCalledWith('test')
      expect(mockCloudDataSource.additionalHeaders).toHaveBeenCalled()
      expect(readFileStub).toHaveBeenCalledWith(path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc', 'server', 'index.js'), 'utf8')

      mockCtx.actions.auth.authApi.getUser = vi.fn().mockRejectedValue(new Error('getUser failed'))

      const getProjectOptions = cyPromptManagerSetupStub.mock.calls[0][0].getProjectOptions

      await expect(getProjectOptions()).rejects.toThrow('getUser failed')
    })

    it('uses no project slug when getProjectConfig fails without fallback projectId', async () => {
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: true,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener(async (cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      const mockManifest = {
        'server/index.js': 'c3c4ab913ca059819549f105e756a4c4471df19abef884ce85eafc7b7970e7b4',
      }

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })

      await cyPromptReadyPromise

      expect(mockCtx.update).toHaveBeenCalledOnce()
      expect(ensureCyPromptBundleStub).toHaveBeenCalledWith({
        cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
        projectId: 'test-project-id',
      })

      expect(cyPromptManagerSetupStub).toHaveBeenCalledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptHash: 'abc',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: expect.any(Function),
        manifest: mockManifest,
      })

      expect(postCyPromptSessionStub).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      })

      expect(mockCloudDataSource.getCloudUrl).toHaveBeenCalledWith('test')
      expect(mockCloudDataSource.additionalHeaders).toHaveBeenCalled()
      expect(readFileStub).toHaveBeenCalledWith(path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc', 'server', 'index.js'), 'utf8')

      mockCtx.project.getConfig = vi.fn().mockRejectedValue(new Error('getProjectConfig failed'))

      const getProjectOptions = cyPromptManagerSetupStub.mock.calls[0][0].getProjectOptions
      const projectOptions = await getProjectOptions()

      expect(projectOptions.projectSlug).toBeUndefined()
    })

    it('uses fallback projectId when getProjectConfig fails', async () => {
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: undefined,
        projectId: 'fallback-project',
      })

      const cyPromptReadyPromise = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener(async (cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      const mockManifest = {
        'server/index.js': 'c3c4ab913ca059819549f105e756a4c4471df19abef884ce85eafc7b7970e7b4',
      }

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })

      await cyPromptReadyPromise

      mockCtx.project.getConfig = vi.fn().mockRejectedValue(new Error('getProjectConfig failed'))

      const getProjectOptions = cyPromptManagerSetupStub.mock.calls[0][0].getProjectOptions
      const projectOptions = await getProjectOptions()

      expect(projectOptions.projectSlug).toBe('fallback-project')
    })

    it('only calls ensureCyPromptBundle once per cy prompt hash', async () => {
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: true,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise1 = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener((cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      const mockManifest = {
        'server/index.js': 'c3c4ab913ca059819549f105e756a4c4471df19abef884ce85eafc7b7970e7b4',
      }

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })

      const cyPromptManager1 = await cyPromptReadyPromise1

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise2 = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener((cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      const cyPromptManager2 = await cyPromptReadyPromise2

      expect(cyPromptManager1).toBe(cyPromptManager2)

      expect(ensureCyPromptBundleStub).toHaveBeenCalledOnce()
      expect(ensureCyPromptBundleStub).toHaveBeenCalledWith({
        cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
        projectId: 'test-project-id',
      })

      expect(cyPromptManagerSetupStub).toHaveBeenCalledOnce()
      expect(cyPromptManagerSetupStub).toHaveBeenCalledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptHash: 'abc',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: expect.any(Function),
        manifest: mockManifest,
      })

      const getProjectOptions = cyPromptManagerSetupStub.mock.calls[0][0].getProjectOptions
      const projectOptions = await getProjectOptions()

      expect(projectOptions).toEqual({
        isOpenMode: false,
        user: {
          authToken: 'test-token',
        },
        projectSlug: 'test-project-id',
        record: true,
        key: '123e4567-e89b-12d3-a456-426614174000',
        recordingInfo: {
          runId: 'test-run-id',
          instanceId: 'test-instance-id',
        },
      })

      expect(postCyPromptSessionStub).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      })

      expect(mockCloudDataSource.getCloudUrl).toHaveBeenCalledWith('test')
      expect(mockCloudDataSource.additionalHeaders).toHaveBeenCalled()
      expect(readFileStub).toHaveBeenCalledWith(path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc', 'server', 'index.js'), 'utf8')
    })

    it('initializes the cy-prompt manager in watch mode if CYPRESS_LOCAL_CY_PROMPT_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener((cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      await cyPromptReadyPromise

      expect(mockCtx.update).toHaveBeenCalledOnce()
      expect(ensureCyPromptBundleStub).not.toHaveBeenCalled()

      expect(cyPromptManagerSetupStub).toHaveBeenCalledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: '/path/to/cy-prompt',
        cyPromptHash: 'local',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: expect.any(Function),
        manifest: {},
      })

      const getProjectOptions = cyPromptManagerSetupStub.mock.calls[0][0].getProjectOptions
      const projectOptions = await getProjectOptions()

      expect(projectOptions).toEqual({
        isOpenMode: false,
        user: {
          authToken: 'test-token',
        },
        projectSlug: 'test-project-id',
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(postCyPromptSessionStub).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      })

      expect(readFileStub).toHaveBeenCalledWith(path.join('/path', 'to', 'cy-prompt', 'server', 'index.js'), 'utf8')

      expect(CyPromptLifecycleManager['watcher']).toBeDefined()
      expect(CyPromptLifecycleManager['watcher']).not.toBeNull()
      expect(watcherStub).toHaveBeenCalledWith(path.join('/path', 'to', 'cy-prompt', 'server', 'index.js'), {
        awaitWriteFinish: true,
      })

      expect(watcherOnStub).toHaveBeenCalledWith('change', expect.any(Function))

      const onCallback = watcherOnStub.mock.calls[0][1]

      let mockCyPromptManagerPromise: Promise<CyPromptManager | null>
      const updatedCyPromptManager = {} as unknown as CyPromptManager

      cyPromptLifecycleManager['createCyPromptManager'] = vi.fn(() => {
        mockCyPromptManagerPromise = new Promise((resolve) => {
          resolve(updatedCyPromptManager)
        })

        return mockCyPromptManagerPromise
      })

      onCallback()

      expect(mockCyPromptManagerPromise).toBeDefined()
      expect(mockCyPromptManagerPromise).not.toBeNull()
      expect(await mockCyPromptManagerPromise).toBe(updatedCyPromptManager)
    })

    it('throws an error when the cy-prompt server script is not found in the manifest', async () => {
      cyPromptManagerSetupStub.mockImplementation((args) => {
        return Promise.resolve()
      })

      const mockManifest = {}

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      // @ts-expect-error - accessing private property
      const cyPromptPromise = cyPromptLifecycleManager.cyPromptManagerPromise

      expect(cyPromptPromise).not.toBeNull()

      const { error } = await cyPromptPromise

      expect(error.message).toBe('Expected hash for cy prompt server script not found in manifest')

      expect(reportCyPromptErrorStub).toHaveBeenCalledWith({
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        cyPromptHash: 'abc',
        projectSlug: 'test-project-id',
        error,
        cyPromptMethod: 'initializeCyPromptManager',
        cyPromptMethodArgs: [],
        additionalHeaders: {
          'Authorization': 'Bearer test-token',
        },
      })
    })

    it('throws an error when the cy-prompt server script is wrong in the manifest', async () => {
      cyPromptManagerSetupStub.mockImplementation((args) => {
        return Promise.resolve()
      })

      const mockManifest = {
        'server/index.js': 'a1',
      }

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      // @ts-expect-error - accessing private property
      const cyPromptPromise = cyPromptLifecycleManager.cyPromptManagerPromise

      expect(cyPromptPromise).not.toBeNull()

      const { error } = await cyPromptPromise

      expect(error.message).toBe('Invalid hash for cy prompt server script')

      expect(reportCyPromptErrorStub).toHaveBeenCalledWith({
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        cyPromptHash: 'abc',
        projectSlug: 'test-project-id',
        error,
        cyPromptMethod: 'initializeCyPromptManager',
        cyPromptMethodArgs: [],
        additionalHeaders: {
          'Authorization': 'Bearer test-token',
        },
      })
    })

    it('handles errors from ensureCyPromptBundle', async () => {
      const actualError = new Error('Test error')

      ensureCyPromptBundleStub.mockRejectedValue(actualError)
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      // @ts-expect-error - accessing private property
      const cyPromptPromise = cyPromptLifecycleManager.cyPromptManagerPromise

      expect(cyPromptPromise).not.toBeNull()

      const { error } = (await cyPromptPromise) as { error: Error }

      expect(error.message).toBe('Test error')

      expect(reportCyPromptErrorStub).toHaveBeenCalledWith({
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        cyPromptHash: 'abc',
        projectSlug: 'test-project-id',
        error: actualError,
        cyPromptMethod: 'initializeCyPromptManager',
        cyPromptMethodArgs: [],
        additionalHeaders: {
          'Authorization': 'Bearer test-token',
        },
      })
    })

    it('handles AggregateErrors from ensureCyPromptBundle', async () => {
      const aggregateError = new AggregateError([new Error('Test error'), new Error('Second error')], 'Multiple errors')

      ensureCyPromptBundleStub.mockRejectedValue(aggregateError)

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      // @ts-expect-error - accessing private property
      const cyPromptPromise = cyPromptLifecycleManager.cyPromptManagerPromise

      expect(cyPromptPromise).not.toBeNull()

      const { error } = (await cyPromptPromise) as { error: Error }

      expect(error.message).toBe('Second error')

      expect(reportCyPromptErrorStub).toHaveBeenCalledWith({
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        cyPromptHash: 'abc',
        projectSlug: 'test-project-id',
        error: aggregateError,
        cyPromptMethod: 'initializeCyPromptManager',
        cyPromptMethodArgs: [],
        additionalHeaders: {
          'Authorization': 'Bearer test-token',
        },
      })
    })
  })

  describe('getCyPrompt', () => {
    it('throws an error when cy-prompt manager is not initialized', async () => {
      await expect(cyPromptLifecycleManager.getCyPrompt()).rejects.toThrow(new Error('cy prompt manager has not been initialized'))
    })

    it('returns the cy-prompt manager when initialized', async () => {
      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManagerPromise = Promise.resolve(mockCyPromptManager)

      const result = await cyPromptLifecycleManager.getCyPrompt()

      expect(result).toBe(mockCyPromptManager)
    })
  })

  describe('resetCyPrompt', () => {
    it('does nothing when cy prompt manager is not assigned', () => {
      cyPromptLifecycleManager.resetCyPrompt()
    })

    it('calls reset on the manager when assigned', () => {
      const resetStub = vi.fn()

      // @ts-expect-error - partial mock
      cyPromptLifecycleManager.cyPromptManager = { reset: resetStub }

      cyPromptLifecycleManager.resetCyPrompt()

      expect(resetStub).toHaveBeenCalledOnce()
    })
  })

  describe('registerCyPromptReadyListener', () => {
    beforeEach(() => {
      const mockManifest = {
        'server/index.js': 'c3c4ab913ca059819549f105e756a4c4471df19abef884ce85eafc7b7970e7b4',
      }

      ensureCyPromptBundleStub.mockResolvedValue({ manifest: mockManifest, cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc') })
    })

    it('registers a listener that will be called when cy-prompt is ready', () => {
      const listener = vi.fn()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).toContain(listener)
    })

    it('calls listener immediately if cy-prompt is already ready', async () => {
      const listener = vi.fn()

      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManager = mockCyPromptManager

      // @ts-expect-error - accessing non-existent property
      cyPromptLifecycleManager.cyPromptReady = true

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      expect(listener).toHaveBeenCalledWith(mockCyPromptManager)
    })

    it('calls listener immediately and adds to the list of listeners when CYPRESS_LOCAL_CY_PROMPT_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'

      const listener = vi.fn()

      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManager = mockCyPromptManager

      // @ts-expect-error - accessing non-existent property
      cyPromptLifecycleManager.cyPromptReady = true

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      expect(listener).toHaveBeenCalledWith(mockCyPromptManager)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).toContain(listener)
    })

    it('does not call listener if cy-prompt manager is null', async () => {
      const listener = vi.fn()

      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManager = null

      // @ts-expect-error - accessing non-existent property
      cyPromptLifecycleManager.cyPromptReady = true

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      expect(listener).not.toHaveBeenCalled()
    })

    it('adds multiple listeners to the list', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener1)
      cyPromptLifecycleManager.registerCyPromptReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).toContain(listener1)
      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).toContain(listener2)
    })

    it('cleans up listeners after calling them when cy-prompt becomes ready', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener1)
      cyPromptLifecycleManager.registerCyPromptReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).toBe(2)

      const listenersCalledPromise = Promise.all([
        new Promise<void>((resolve) => {
          listener1.mockImplementation(() => resolve())
        }),
        new Promise<void>((resolve) => {
          listener2.mockImplementation(() => resolve())
        }),
      ])

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      await listenersCalledPromise

      expect(listener1).toHaveBeenCalledWith(mockCyPromptManager)
      expect(listener2).toHaveBeenCalledWith(mockCyPromptManager)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).toBe(0)
    })

    it('does not clean up listeners when CYPRESS_LOCAL_CY_PROMPT_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'

      const listener1 = vi.fn()
      const listener2 = vi.fn()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener1)
      cyPromptLifecycleManager.registerCyPromptReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).toBe(2)

      const listenersCalledPromise = Promise.all([
        new Promise<void>((resolve) => {
          listener1.mockImplementation(() => resolve())
        }),
        new Promise<void>((resolve) => {
          listener2.mockImplementation(() => resolve())
        }),
      ])

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      await listenersCalledPromise

      expect(listener1).toHaveBeenCalledWith(mockCyPromptManager)
      expect(listener2).toHaveBeenCalledWith(mockCyPromptManager)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).toBe(2)
    })
  })
})
