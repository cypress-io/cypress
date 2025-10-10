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
    // Fake StudioElectron so we can assert calls
    class FakeStudioElectron {
      // @ts-ignore - assigned in ctor
      destroy: sinon.SinonStub
      constructor () {
        this.destroy = sinon.stub()
      }
    }

    StudioManager = (proxyquire('../lib/cloud/studio/studio', {
      '../api/studio/report_studio_error': {
        reportStudioError,
      },
      './StudioElectron': {
        StudioElectron: FakeStudioElectron,
      },
    }) as typeof import('@packages/server/lib/cloud/studio/studio')).StudioManager

    studioManager = new StudioManager()
    await studioManager.setup({
      script: stubStudio,
      studioPath: 'path',
      studioHash: 'abcdefg',
      getProjectOptions: sinon.stub().resolves({
        projectSlug: '1234',
      }),
      cloudApi: {} as any,
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

    it('handles non-Error objects by converting them to Error instances', () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Something went wrong',
      }

      sinon.stub(studio, 'initializeRoutes').throws(objectError)
      sinon.stub(studio, 'reportError')

      studioManager.initializeRoutes({} as any)

      expect(studioManager.status).to.eq('IN_ERROR')
      expect(studio.reportError).to.be.calledWithMatch(
        sinon.match((error) => {
          return error instanceof Error
        }),
        'initializeRoutes',
        {},
      )
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

    it('handles non-Error objects in async methods by converting them to Error instances', async () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Async error occurred',
      }

      sinon.stub(studio, 'initializeStudioAI').throws(objectError)
      sinon.stub(studio, 'reportError')

      await studioManager.initializeStudioAI({} as any)

      expect(studioManager.status).to.eq('IN_ERROR')
      expect(studio.reportError).to.be.calledWithMatch(
        sinon.match((error) => {
          return error instanceof Error
        }),
        'initializeStudioAI',
        {},
      )
    })

    it('does not set state IN_ERROR when a non-essential async method fails', async () => {
      const error = new Error('foo')

      sinon.stub(studio, 'captureStudioEvent').throws(error)

      await studioManager.captureStudioEvent({} as any)

      expect(studioManager.status).to.eq('ENABLED')
    })

    it('handles non-Error objects in non-essential async methods without changing status', async () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Non-essential error occurred',
      }

      sinon.stub(studio, 'captureStudioEvent').throws(objectError)
      sinon.stub(studio, 'reportError')

      await studioManager.captureStudioEvent({} as any)

      expect(studioManager.status).to.eq('ENABLED')
      expect(studio.reportError).to.be.calledWithMatch(
        sinon.match((error) => {
          return error instanceof Error
        }),
        'captureStudioEvent',
        {},
      )
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

    it('returns true when studio server can access AI', async () => {
      sinon.stub(studio, 'canAccessStudioAI').resolves(true)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).to.be.true
    })

    it('returns false when studio server cannot access AI', async () => {
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

      expect((studioManager as any)._studioElectron).to.exist

      expect(studio.initializeStudioAI).to.be.calledWith(
        sinon.match.has('protocolDbPath', 'test-db-path').and(
          sinon.match.has('studioElectron'),
        ),
      )
    })
  })

  describe('captureStudioEvent', () => {
    it('captures a studio event', async () => {
      sinon.stub(studio, 'captureStudioEvent').resolves()

      await studioManager.captureStudioEvent({
        type: 'studio:started',
        machineId: 'test-machine-id',
      })

      expect(studio.captureStudioEvent).to.be.calledWith({
        type: 'studio:started',
        machineId: 'test-machine-id',
      })
    })

    it('does not call captureStudioEvent when studio server is not defined', () => {
      // Set _studioServer to undefined
      (studioManager as any)._studioServer = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = sinon.spy(studioManager, 'invokeSync')

      studioManager.captureStudioEvent({
        type: 'studio:started',
        machineId: 'test-machine-id',
      })

      expect(invokeSyncSpy).to.not.be.called
    })
  })

  describe('updateSessionId', () => {
    it('updates the session ID', () => {
      sinon.stub(studio, 'updateSessionId')
      const mockSessionId = 'test-session-id'

      studioManager.updateSessionId(mockSessionId)

      expect(studio.updateSessionId).to.be.calledWith(mockSessionId)
    })

    it('does not call updateSessionId when studio server is not defined', () => {
      // Set _studioServer to undefined
      (studioManager as any)._studioServer = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = sinon.spy(studioManager, 'invokeSync')

      studioManager.updateSessionId('test-session-id')

      expect(invokeSyncSpy).to.not.be.called
    })

    it('does not call updateSessionId when _studioServer.updateSessionId is not a function', () => {
      // Set _studioServer.updateSessionId to undefined
      (studioManager as any)._studioServer.updateSessionId = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = sinon.spy(studioManager, 'invokeSync')

      studioManager.updateSessionId('test-session-id')

      expect(invokeSyncSpy).to.not.be.called
    })
  })

  describe('reportError', () => {
    it('reports an error', () => {
      sinon.stub(studio, 'reportError')
      const error = new Error('foo')

      studioManager.reportError(error, 'reportError', 'test-args')

      expect(studio.reportError).to.be.calledWith(error, 'reportError', 'test-args')
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
