import { proxyquire, sinon } from '../../../spec_helper'
import path from 'path'
import type { StudioServerShape } from '@packages/types'
import { expect } from 'chai'
import esbuild from 'esbuild'
import type { StudioManager as StudioManagerShape } from '@packages/server/lib/cloud/studio/studio'
import os from 'os'

const { outputFiles: [{ contents: stubStudioRaw }] } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', '..', '..', 'support', 'fixtures', 'cloud', 'studio', 'test-studio.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
})
const stubStudio = new TextDecoder('utf-8').decode(stubStudioRaw)

describe('lib/cloud/studio', () => {
  let studioManager: StudioManagerShape
  let studio: StudioServerShape
  let StudioManager: typeof import('@packages/server/lib/cloud/studio/studio').StudioManager
  let reportStudioError: sinon.SinonStub

  beforeEach(async () => {
    reportStudioError = sinon.stub()
    StudioManager = (proxyquire('../lib/cloud/studio/studio', {
      '../api/studio/report_studio_error': {
        reportStudioError,
      },
    }) as typeof import('@packages/server/lib/cloud/studio/studio')).StudioManager

    studioManager = new StudioManager()
    await studioManager.setup({
      script: stubStudio,
      studioPath: 'path',
      studioHash: 'abcdefg',
      projectSlug: '1234',
      cloudApi: {} as any,
      shouldEnableStudio: true,
      manifest: {
        'server/index.js': 'abcdefg',
      },
    })

    studio = (studioManager as any)._studioServer

    sinon.stub(os, 'platform').returns('darwin')
    sinon.stub(os, 'arch').returns('x64')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('synchronous method invocation', () => {
    it('reports an error when a synchronous method fails', () => {
      const error = new Error('foo')

      sinon.stub(studio, 'initializeRoutes').throws(error)
      sinon.stub(studio, 'reportError')

      studioManager.initializeRoutes({} as any)

      expect(studioManager.status).to.eq('IN_ERROR')
      expect(studio.reportError).to.be.calledWithMatch(error, 'initializeRoutes', {})
    })
  })

  describe('asynchronous method invocation', () => {
    it('reports an error when a asynchronous method fails', async () => {
      const error = new Error('foo')

      sinon.stub(studio, 'initializeStudioAI').throws(error)
      sinon.stub(studio, 'reportError')

      await studioManager.initializeStudioAI({} as any)

      expect(studioManager.status).to.eq('IN_ERROR')
      expect(studio.reportError).to.be.calledWithMatch(error, 'initializeStudioAI', {})
    })

    it('does not set state IN_ERROR when a non-essential async method fails', async () => {
      const error = new Error('foo')

      sinon.stub(studio, 'captureStudioEvent').throws(error)

      await studioManager.captureStudioEvent({} as any)

      expect(studioManager.status).to.eq('ENABLED')
    })
  })

  describe('createInErrorManager', () => {
    it('creates a studio manager in error state', () => {
      const error = new Error('foo')
      const manager = StudioManager.createInErrorManager({
        error,
        cloudApi: {} as any,
        studioHash: 'abcdefg',
        projectSlug: '1234',
        studioMethod: 'initializeRoutes',
      })

      expect(manager.status).to.eq('IN_ERROR')
      expect(reportStudioError).to.be.calledWithMatch({
        error,
        cloudApi: {} as any,
        studioHash: 'abcdefg',
        projectSlug: '1234',
        studioMethod: 'initializeRoutes',
        studioMethodArgs: undefined,
      })
    })
  })

  describe('initializeRoutes', () => {
    it('initializes routes', () => {
      sinon.stub(studio, 'initializeRoutes')
      const mockRouter = sinon.stub()

      studioManager.initializeRoutes(mockRouter)

      expect(studio.initializeRoutes).to.be.calledWith(mockRouter)
    })
  })

  describe('canAccessStudioAI', () => {
    const browser = {
      name: 'chrome',
      family: 'chromium' as const,
      channel: 'stable',
      displayName: 'Chrome',
      version: '120.0.0',
      majorVersion: '120',
      path: '/path/to/chrome',
      isHeaded: true,
      isHeadless: false,
    }

    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
      originalEnv = process.env
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('returns true when CYPRESS_ENABLE_CLOUD_STUDIO_AI is true and studio server can access AI', async () => {
      process.env.CYPRESS_ENABLE_CLOUD_STUDIO_AI = 'true'

      sinon.stub(studio, 'canAccessStudioAI').resolves(true)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).to.be.true
    })

    it('returns false when CYPRESS_ENABLE_CLOUD_STUDIO_AI is false and studio server can access AI', async () => {
      process.env.CYPRESS_ENABLE_CLOUD_STUDIO_AI = 'false'

      sinon.stub(studio, 'canAccessStudioAI').resolves(true)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).to.be.false
    })

    it('returns false when CYPRESS_ENABLE_CLOUD_STUDIO_AI is true and studio server cannot access AI', async () => {
      process.env.CYPRESS_ENABLE_CLOUD_STUDIO_AI = 'true'

      sinon.stub(studio, 'canAccessStudioAI').resolves(false)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).to.be.false
    })

    it('returns true when CYPRESS_LOCAL_STUDIO_PATH is set and studio server can access AI', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = 'path/to/studio'

      sinon.stub(studio, 'canAccessStudioAI').resolves(true)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).to.be.true
    })

    it('returns false when CYPRESS_LOCAL_STUDIO_PATH is not set and studio server can access AI', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = undefined

      sinon.stub(studio, 'canAccessStudioAI').resolves(true)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).to.be.false
    })

    it('returns false when CYPRESS_LOCAL_STUDIO_PATH is set and studio server cannot access AI', async () => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = 'path/to/studio'

      sinon.stub(studio, 'canAccessStudioAI').resolves(false)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).to.be.false
    })
  })

  describe('addSocketListeners', () => {
    it('calls addSocketListeners on the studio server', () => {
      sinon.stub(studio, 'addSocketListeners')
      const mockSocket = { id: 'test-socket' } as any

      studioManager.addSocketListeners(mockSocket)

      expect(studio.addSocketListeners).to.be.calledWith(mockSocket)
    })

    it('does not call addSocketListeners when studio server is not defined', () => {
      // Set _studioServer to undefined
      (studioManager as any)._studioServer = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = sinon.spy(studioManager, 'invokeSync')

      const mockSocket = { id: 'test-socket' } as any

      studioManager.addSocketListeners(mockSocket)

      expect(invokeSyncSpy).to.not.be.called
    })
  })

  describe('initializeStudioAI', () => {
    it('initializes Studio AI on the studio server', async () => {
      sinon.stub(studio, 'initializeStudioAI').resolves()

      await studioManager.initializeStudioAI({
        protocolDbPath: 'test-db-path',
      })

      expect(studio.initializeStudioAI).to.be.calledWith({
        protocolDbPath: 'test-db-path',
      })
    })
  })

  describe('destroy', () => {
    it('destroys the studio server', async () => {
      sinon.stub(studio, 'destroy').resolves()

      await studioManager.destroy()

      expect(studio.destroy).to.be.called
    })
  })
})
