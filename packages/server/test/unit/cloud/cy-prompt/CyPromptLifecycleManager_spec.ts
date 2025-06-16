import { sinon, proxyquire } from '../../../spec_helper'
import { expect } from 'chai'
import { CyPromptManager } from '../../../../lib/cloud/cy-prompt/CyPromptManager'
import { CyPromptLifecycleManager } from '../../../../lib/cloud/cy-prompt/CyPromptLifecycleManager'
import type { DataContext } from '@packages/data-context'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import path from 'path'
import os from 'os'
import { CloudRequest } from '../../../../lib/cloud/api/cloud_request'
import { isRetryableError } from '../../../../lib/cloud/network/is_retryable_error'
import { asyncRetry } from '../../../../lib/util/async_retry'

describe('CyPromptLifecycleManager', () => {
  let cyPromptLifecycleManager: CyPromptLifecycleManager
  let mockCyPromptManager: CyPromptManager
  let mockCtx: DataContext
  let mockCloudDataSource: CloudDataSource
  let CyPromptLifecycleManager: typeof import('../../../../lib/cloud/cy-prompt/CyPromptLifecycleManager').CyPromptLifecycleManager
  let postCyPromptSessionStub: sinon.SinonStub
  let cyPromptStatusChangeEmitterStub: sinon.SinonStub
  let ensureCyPromptBundleStub: sinon.SinonStub
  let cyPromptManagerSetupStub: sinon.SinonStub = sinon.stub()
  let readFileStub: sinon.SinonStub = sinon.stub()
  let watcherStub: sinon.SinonStub = sinon.stub()
  let watcherOnStub: sinon.SinonStub = sinon.stub()
  let watcherCloseStub: sinon.SinonStub = sinon.stub()

  beforeEach(() => {
    postCyPromptSessionStub = sinon.stub()
    cyPromptManagerSetupStub = sinon.stub()
    ensureCyPromptBundleStub = sinon.stub()
    cyPromptStatusChangeEmitterStub = sinon.stub()
    mockCyPromptManager = {
      status: 'INITIALIZED',
      setup: cyPromptManagerSetupStub.resolves(),
    } as unknown as CyPromptManager

    readFileStub = sinon.stub()
    CyPromptLifecycleManager = proxyquire('../lib/cloud/cy-prompt/CyPromptLifecycleManager', {
      './ensure_cy_prompt_bundle': {
        ensureCyPromptBundle: ensureCyPromptBundleStub,
      },
      '../api/cy-prompt/post_cy_prompt_session': {
        postCyPromptSession: postCyPromptSessionStub,
      },
      './CyPromptManager': {
        CyPromptManager: class CyPromptManager {
          constructor () {
            return mockCyPromptManager
          }
        },
      },
      'fs-extra': {
        readFile: readFileStub.resolves('console.log("cy-prompt script")'),
      },
      'chokidar': {
        watch: watcherStub.returns({
          on: watcherOnStub,
          close: watcherCloseStub,
        }),
      },
    }).CyPromptLifecycleManager

    cyPromptLifecycleManager = new CyPromptLifecycleManager()

    cyPromptStatusChangeEmitterStub = sinon.stub()

    mockCtx = {
      update: sinon.stub(),
      coreData: {},
      cloud: {
        getCloudUrl: sinon.stub().returns('https://cloud.cypress.io'),
        additionalHeaders: sinon.stub().resolves({ 'Authorization': 'Bearer test-token' }),
      },
      emitter: {
        cyPromptStatusChange: cyPromptStatusChangeEmitterStub,
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
          projectId: 'test-project-id',
        }),
      },
    } as unknown as DataContext

    mockCloudDataSource = {
      getCloudUrl: sinon.stub().returns('https://cloud.cypress.io'),
      additionalHeaders: sinon.stub().resolves({ 'Authorization': 'Bearer test-token' }),
    } as CloudDataSource

    postCyPromptSessionStub.resolves({
      cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
    })
  })

  afterEach(() => {
    sinon.restore()

    delete process.env.CYPRESS_LOCAL_CY_PROMPT_PATH
  })

  describe('initializeCyPromptManager', () => {
    it('initializes the cy-prompt manager and registers it in the data context', async () => {
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener(async (cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

      await cyPromptReadyPromise

      expect(mockCtx.update).to.be.calledOnce
      expect(ensureCyPromptBundleStub).to.be.calledWith({
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
        projectId: 'test-project-id',
      })

      expect(cyPromptManagerSetupStub).to.be.calledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptHash: 'abc',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: sinon.match.func,
      })

      expect(postCyPromptSessionStub).to.be.calledWith({
        projectId: 'test-project-id',
      })

      expect(mockCloudDataSource.getCloudUrl).to.be.calledWith('test')
      expect(mockCloudDataSource.additionalHeaders).to.be.called
      expect(readFileStub).to.be.calledWith(path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc', 'server', 'index.js'), 'utf8')
    })

    it('only calls ensureCyPromptBundle once per cy prompt hash', async () => {
      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      const cyPromptReadyPromise1 = new Promise((resolve) => {
        cyPromptLifecycleManager?.registerCyPromptReadyListener((cyPromptManager) => {
          resolve(cyPromptManager)
        })
      })

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

      expect(cyPromptManager1).to.equal(cyPromptManager2)

      expect(ensureCyPromptBundleStub).to.be.calledOnce
      expect(ensureCyPromptBundleStub).to.be.calledWith({
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptUrl: 'https://cloud.cypress.io/cy-prompt/bundle/abc.tgz',
        projectId: 'test-project-id',
      })

      expect(cyPromptManagerSetupStub).to.be.calledOnce
      expect(cyPromptManagerSetupStub).to.be.calledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc'),
        cyPromptHash: 'abc',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: sinon.match.func,
      })

      expect(postCyPromptSessionStub).to.be.calledWith({
        projectId: 'test-project-id',
      })

      expect(mockCloudDataSource.getCloudUrl).to.be.calledWith('test')
      expect(mockCloudDataSource.additionalHeaders).to.be.called
      expect(readFileStub).to.be.calledWith(path.join(os.tmpdir(), 'cypress', 'cy-prompt', 'abc', 'server', 'index.js'), 'utf8')
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

      expect(mockCtx.update).to.be.calledOnce
      expect(ensureCyPromptBundleStub).to.not.be.called

      expect(cyPromptManagerSetupStub).to.be.calledWith({
        script: 'console.log("cy-prompt script")',
        cyPromptPath: '/path/to/cy-prompt',
        cyPromptHash: 'local',
        cloudApi: {
          cloudUrl: 'https://cloud.cypress.io',
          CloudRequest,
          isRetryableError,
          asyncRetry,
        },
        getProjectOptions: sinon.match.func,
      })

      expect(postCyPromptSessionStub).to.be.calledWith({
        projectId: 'test-project-id',
      })

      expect(readFileStub).to.be.calledWith(path.join('/path', 'to', 'cy-prompt', 'server', 'index.js'), 'utf8')

      expect(CyPromptLifecycleManager['watcher']).to.be.present
      expect(watcherStub).to.be.calledWith(path.join('/path', 'to', 'cy-prompt', 'server', 'index.js'), {
        awaitWriteFinish: true,
      })

      expect(watcherOnStub).to.be.calledWith('change')

      const onCallback = watcherOnStub.args[0][1]

      let mockCyPromptManagerPromise: Promise<CyPromptManager | null>
      const updatedCyPromptManager = {} as unknown as CyPromptManager

      cyPromptLifecycleManager['createCyPromptManager'] = sinon.stub().callsFake(() => {
        mockCyPromptManagerPromise = new Promise((resolve) => {
          resolve(updatedCyPromptManager)
        })

        return mockCyPromptManagerPromise
      })

      onCallback()

      expect(mockCyPromptManagerPromise).to.be.present
      expect(await mockCyPromptManagerPromise).to.equal(updatedCyPromptManager)
    })
  })

  describe('getCyPrompt', () => {
    it('throws an error when cy-prompt manager is not initialized', async () => {
      try {
        await cyPromptLifecycleManager.getCyPrompt()
        expect.fail('Expected method to throw')
      } catch (error) {
        expect(error.message).to.equal('cy prompt manager has not been initialized')
      }
    })

    it('returns the cy-prompt manager when initialized', async () => {
      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManagerPromise = Promise.resolve(mockCyPromptManager)

      const result = await cyPromptLifecycleManager.getCyPrompt()

      expect(result).to.equal(mockCyPromptManager)
    })
  })

  describe('registerCyPromptReadyListener', () => {
    it('registers a listener that will be called when cy-prompt is ready', () => {
      const listener = sinon.stub()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).to.include(listener)
    })

    it('calls listener immediately if cy-prompt is already ready', async () => {
      const listener = sinon.stub()

      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManager = mockCyPromptManager

      // @ts-expect-error - accessing non-existent property
      cyPromptLifecycleManager.cyPromptReady = true

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      expect(listener).to.be.calledWith(mockCyPromptManager)
    })

    it('calls listener immediately and adds to the list of listeners when CYPRESS_LOCAL_CY_PROMPT_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'

      const listener = sinon.stub()

      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManager = mockCyPromptManager

      // @ts-expect-error - accessing non-existent property
      cyPromptLifecycleManager.cyPromptReady = true

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      expect(listener).to.be.calledWith(mockCyPromptManager)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).to.include(listener)
    })

    it('does not call listener if cy-prompt manager is null', async () => {
      const listener = sinon.stub()

      // @ts-expect-error - accessing private property
      cyPromptLifecycleManager.cyPromptManager = null

      // @ts-expect-error - accessing non-existent property
      cyPromptLifecycleManager.cyPromptReady = true

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener)

      expect(listener).not.to.be.called
    })

    it('adds multiple listeners to the list', () => {
      const listener1 = sinon.stub()
      const listener2 = sinon.stub()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener1)
      cyPromptLifecycleManager.registerCyPromptReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).to.include(listener1)
      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners).to.include(listener2)
    })

    it('cleans up listeners after calling them when cy-prompt becomes ready', async () => {
      const listener1 = sinon.stub()
      const listener2 = sinon.stub()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener1)
      cyPromptLifecycleManager.registerCyPromptReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).to.equal(2)

      const listenersCalledPromise = Promise.all([
        new Promise<void>((resolve) => {
          listener1.callsFake(() => resolve())
        }),
        new Promise<void>((resolve) => {
          listener2.callsFake(() => resolve())
        }),
      ])

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      await listenersCalledPromise

      expect(listener1).to.be.calledWith(mockCyPromptManager)
      expect(listener2).to.be.calledWith(mockCyPromptManager)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).to.equal(0)
    })

    it('does not clean up listeners when CYPRESS_LOCAL_CY_PROMPT_PATH is set', async () => {
      process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'

      const listener1 = sinon.stub()
      const listener2 = sinon.stub()

      cyPromptLifecycleManager.registerCyPromptReadyListener(listener1)
      cyPromptLifecycleManager.registerCyPromptReadyListener(listener2)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).to.equal(2)

      const listenersCalledPromise = Promise.all([
        new Promise<void>((resolve) => {
          listener1.callsFake(() => resolve())
        }),
        new Promise<void>((resolve) => {
          listener2.callsFake(() => resolve())
        }),
      ])

      cyPromptLifecycleManager.initializeCyPromptManager({
        cloudDataSource: mockCloudDataSource,
        ctx: mockCtx,
        record: false,
        key: '123e4567-e89b-12d3-a456-426614174000',
      })

      await listenersCalledPromise

      expect(listener1).to.be.calledWith(mockCyPromptManager)
      expect(listener2).to.be.calledWith(mockCyPromptManager)

      // @ts-expect-error - accessing private property
      expect(cyPromptLifecycleManager.listeners.length).to.equal(2)
    })
  })
})
