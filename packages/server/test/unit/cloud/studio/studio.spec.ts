import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'path'
import type { StudioServerShape } from '@packages/types'
import esbuild from 'esbuild'
import os from 'os'
import { StudioManager } from '../../../../lib/cloud/studio/studio'

const state = vi.hoisted(() => {
  return {
    requireScript: undefined as undefined | ((script: string) => unknown),
  }
})

vi.mock('../../../../lib/cloud/studio/StudioElectron', () => {
  class FakeStudioElectron {
    destroy = vi.fn()
  }

  return { StudioElectron: FakeStudioElectron }
})

vi.mock('../../../../lib/cloud/require_script', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/require_script')>()

  return {
    ...actual,
    requireScript: (script: string) => (state.requireScript ?? actual.requireScript)(script),
  }
})

const { outputFiles: [{ contents: stubStudioRaw }] } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', '..', '..', 'support', 'fixtures', 'cloud', 'studio', 'test-studio.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
})
const stubStudio = new TextDecoder('utf-8').decode(stubStudioRaw)

describe('lib/cloud/studio', () => {
  let studioManager: StudioManager
  let studio: StudioServerShape

  beforeEach(async () => {
    studioManager = new StudioManager()
    await studioManager.setup({
      script: stubStudio,
      studioPath: 'path',
      studioHash: 'abcdefg',
      getProjectOptions: vi.fn().mockResolvedValue({
        projectSlug: '1234',
      }),
      cloudApi: {} as any,
      manifest: {
        'server/index.js': 'abcdefg',
      },
    })

    studio = (studioManager as any)._studioServer

    vi.spyOn(os, 'platform').mockReturnValue('darwin')
    vi.spyOn(os, 'arch').mockReturnValue('x64')
  })

  afterEach(() => {
    state.requireScript = undefined
    vi.restoreAllMocks()
  })

  describe('setup', () => {
    it('passes debugData to createStudioServer when provided', async () => {
      const createStudioServerStub = vi.fn().mockResolvedValue({
        initializeRoutes: vi.fn(),
        canAccessStudioAI: vi.fn().mockResolvedValue(true),
        initializeStudioAI: vi.fn().mockResolvedValue(undefined),
        reportError: vi.fn(),
        destroy: vi.fn().mockResolvedValue(undefined),
        addSocketListeners: vi.fn(),
        captureStudioEvent: vi.fn().mockResolvedValue(undefined),
        updateSessionId: vi.fn(),
        connectToBrowser: vi.fn(),
      })

      state.requireScript = () => {
        return {
          default: { createStudioServer: createStudioServerStub },
        }
      }

      const manager = new StudioManager()
      const debugData = { filePreprocessorHandlerText: 'handler text' }

      await manager.setup({
        script: 'script',
        studioPath: 'path',
        studioHash: 'abcdefg',
        getProjectOptions: vi.fn().mockResolvedValue({ projectSlug: '1234' }),
        cloudApi: {} as any,
        manifest: { 'server/index.js': 'abcdefg' },
        debugData,
      })

      expect(createStudioServerStub).toHaveBeenCalledOnce()
      expect(createStudioServerStub.mock.calls[0][0].debugData).toStrictEqual(debugData)
    })

    it('passes undefined debugData to createStudioServer when not provided', async () => {
      const createStudioServerStub = vi.fn().mockResolvedValue({
        initializeRoutes: vi.fn(),
        canAccessStudioAI: vi.fn().mockResolvedValue(true),
        initializeStudioAI: vi.fn().mockResolvedValue(undefined),
        reportError: vi.fn(),
        destroy: vi.fn().mockResolvedValue(undefined),
        addSocketListeners: vi.fn(),
        captureStudioEvent: vi.fn().mockResolvedValue(undefined),
        updateSessionId: vi.fn(),
        connectToBrowser: vi.fn(),
      })

      state.requireScript = () => {
        return {
          default: { createStudioServer: createStudioServerStub },
        }
      }

      const manager = new StudioManager()

      await manager.setup({
        script: 'script',
        studioPath: 'path',
        studioHash: 'abcdefg',
        getProjectOptions: vi.fn().mockResolvedValue({ projectSlug: '1234' }),
        cloudApi: {} as any,
        manifest: { 'server/index.js': 'abcdefg' },
      })

      expect(createStudioServerStub).toHaveBeenCalledOnce()
      const options = createStudioServerStub.mock.calls[0][0]

      expect(options).toHaveProperty('debugData')
      expect(options.debugData).toBeUndefined()
    })
  })

  describe('synchronous method invocation', () => {
    it('reports an error when a synchronous method fails', () => {
      const error = new Error('foo')

      vi.spyOn(studio, 'initializeRoutes').mockImplementation(() => {
        throw error
      })

      vi.spyOn(studio, 'reportError').mockImplementation(() => {})

      studioManager.initializeRoutes({} as any)

      expect(studioManager.status).toBe('IN_ERROR')
      expect(studio.reportError).toHaveBeenCalledWith(error, 'initializeRoutes', {})
    })

    it('handles non-Error objects by converting them to Error instances', () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Something went wrong',
      }

      vi.spyOn(studio, 'initializeRoutes').mockImplementation(() => {
        throw objectError
      })

      vi.spyOn(studio, 'reportError').mockImplementation(() => {})

      studioManager.initializeRoutes({} as any)

      expect(studioManager.status).toBe('IN_ERROR')
      expect(studio.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'initializeRoutes',
        {},
      )
    })

    // the Cloud ships the studio server as a class instance whose methods rely on `this`
    it('invokes the method on the studio server instance', () => {
      const initializeRoutes = vi.spyOn(studio, 'initializeRoutes').mockImplementation(() => {})

      studioManager.initializeRoutes({} as any)

      expect(initializeRoutes.mock.contexts).toContain(studio)
    })

    it('forwards no arguments when the caller supplies none', () => {
      const getCachedStudioConfig = vi.spyOn(studio, 'getCachedStudioConfig').mockReturnValue({} as any)

      studioManager.getCachedStudioConfig()

      expect(getCachedStudioConfig.mock.contexts).toContain(studio)
      expect(getCachedStudioConfig.mock.calls[0]).toStrictEqual([])
    })
  })

  describe('asynchronous method invocation', () => {
    it('reports an error when a asynchronous method fails', async () => {
      const error = new Error('foo')

      vi.spyOn(studio, 'initializeStudioAI').mockImplementation(() => {
        throw error
      })

      vi.spyOn(studio, 'reportError').mockImplementation(() => {})

      await studioManager.initializeStudioAI({} as any)

      expect(studioManager.status).toBe('IN_ERROR')
      expect(studio.reportError).toHaveBeenCalledWith(error, 'initializeStudioAI', expect.objectContaining({}))
    })

    it('handles non-Error objects in async methods by converting them to Error instances', async () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Async error occurred',
      }

      vi.spyOn(studio, 'initializeStudioAI').mockImplementation(() => {
        throw objectError
      })

      vi.spyOn(studio, 'reportError').mockImplementation(() => {})

      await studioManager.initializeStudioAI({} as any)

      expect(studioManager.status).toBe('IN_ERROR')
      expect(studio.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'initializeStudioAI',
        expect.objectContaining({}),
      )
    })

    it('does not set state IN_ERROR when a non-essential async method fails', async () => {
      const error = new Error('foo')

      vi.spyOn(studio, 'captureStudioEvent').mockImplementation(() => {
        throw error
      })

      await studioManager.captureStudioEvent({} as any)

      expect(studioManager.status).toBe('ENABLED')
    })

    it('handles non-Error objects in non-essential async methods without changing status', async () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Non-essential error occurred',
      }

      vi.spyOn(studio, 'captureStudioEvent').mockImplementation(() => {
        throw objectError
      })

      vi.spyOn(studio, 'reportError').mockImplementation(() => {})

      await studioManager.captureStudioEvent({} as any)

      expect(studioManager.status).toBe('ENABLED')
      expect(studio.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'captureStudioEvent',
        {},
      )
    })

    it('invokes the method on the studio server instance', async () => {
      const captureStudioEvent = vi.spyOn(studio, 'captureStudioEvent').mockResolvedValue(undefined)

      await studioManager.captureStudioEvent({} as any)

      expect(captureStudioEvent.mock.contexts).toContain(studio)
    })

    it('forwards the argument and returns the resolved value', async () => {
      const config = { canAccessStudioAI: true } as any
      const browser = { name: 'chrome' } as any

      const getStudioConfig = vi.spyOn(studio, 'getStudioConfig').mockResolvedValue(config)

      const result = await studioManager.getStudioConfig(browser)

      expect(getStudioConfig.mock.contexts).toContain(studio)
      expect(getStudioConfig).toHaveBeenCalledWith(browser)
      expect(result).toBe(config)
    })
  })

  describe('initializeRoutes', () => {
    it('initializes routes', () => {
      vi.spyOn(studio, 'initializeRoutes').mockImplementation(() => {})
      const mockRouter = vi.fn()

      studioManager.initializeRoutes(mockRouter as any)

      expect(studio.initializeRoutes).toHaveBeenCalledWith(mockRouter)
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
      vi.spyOn(studio, 'canAccessStudioAI').mockResolvedValue(true)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).toBe(true)
    })

    it('returns false when studio server cannot access AI', async () => {
      vi.spyOn(studio, 'canAccessStudioAI').mockResolvedValue(false)

      const result = await studioManager.canAccessStudioAI(browser)

      expect(result).toBe(false)
    })
  })

  describe('getStudioConfig and getCachedStudioConfig', () => {
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

    it('getStudioConfig returns config when server is initialized', async () => {
      const config = await studioManager.getStudioConfig(browser as Cypress.Browser)

      expect(config).toHaveProperty('AI')
      expect(config.AI).toHaveProperty('enabled')
      expect(config).toHaveProperty('featureFlags')
    })

    it('getStudioConfig throws when server is not initialized', async () => {
      const manager = new StudioManager()

      await expect(manager.getStudioConfig(browser as Cypress.Browser))
      .rejects.toThrow('Studio is not available: server not initialized or an error occurred')
    })

    it('getCachedStudioConfig returns config when server is initialized', () => {
      const config = studioManager.getCachedStudioConfig()

      expect(config).toHaveProperty('AI')
      expect(config.AI).toHaveProperty('enabled')
      expect(config).toHaveProperty('featureFlags')
    })

    it('getCachedStudioConfig throws when server is not initialized', () => {
      const manager = new StudioManager()

      expect(() => manager.getCachedStudioConfig())
      .toThrow('Studio is not available: server not initialized or an error occurred')
    })
  })

  describe('addSocketListeners', () => {
    it('calls addSocketListeners on the studio server', () => {
      vi.spyOn(studio, 'addSocketListeners').mockImplementation(() => {})
      const mockSocket = { id: 'test-socket' } as any

      studioManager.addSocketListeners(mockSocket)

      expect(studio.addSocketListeners).toHaveBeenCalledWith(mockSocket)
    })

    it('does not call addSocketListeners when studio server is not defined', () => {
      // Set _studioServer to undefined
      (studioManager as any)._studioServer = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = vi.spyOn(studioManager as any, 'invokeSync')

      const mockSocket = { id: 'test-socket' } as any

      studioManager.addSocketListeners(mockSocket)

      expect(invokeSyncSpy).not.toHaveBeenCalled()
    })
  })

  describe('initializeStudioAI', () => {
    it('initializes Studio AI on the studio server', async () => {
      vi.spyOn(studio, 'initializeStudioAI').mockResolvedValue(undefined)

      await studioManager.initializeStudioAI({
        protocolDbPath: 'test-db-path',
      })

      expect((studioManager as any)._studioElectron).toBeDefined()
      expect((studioManager as any)._studioElectron).not.toBeNull()

      expect(studio.initializeStudioAI).toHaveBeenCalledWith(
        expect.objectContaining({
          protocolDbPath: 'test-db-path',
          studioElectron: expect.anything(),
        }),
      )
    })
  })

  describe('captureStudioEvent', () => {
    it('captures a studio event', async () => {
      vi.spyOn(studio, 'captureStudioEvent').mockResolvedValue(undefined)

      await studioManager.captureStudioEvent({
        type: 'studio:started',
        machineId: 'test-machine-id',
      })

      expect(studio.captureStudioEvent).toHaveBeenCalledWith({
        type: 'studio:started',
        machineId: 'test-machine-id',
      })
    })

    it('does not call captureStudioEvent when studio server is not defined', () => {
      // Set _studioServer to undefined
      (studioManager as any)._studioServer = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = vi.spyOn(studioManager as any, 'invokeSync')

      studioManager.captureStudioEvent({
        type: 'studio:started',
        machineId: 'test-machine-id',
      })

      expect(invokeSyncSpy).not.toHaveBeenCalled()
    })
  })

  describe('updateSessionId', () => {
    it('updates the session ID', () => {
      vi.spyOn(studio, 'updateSessionId').mockImplementation(() => {})
      const mockSessionId = 'test-session-id'

      studioManager.updateSessionId(mockSessionId)

      expect(studio.updateSessionId).toHaveBeenCalledWith(mockSessionId)
    })

    it('does not call updateSessionId when studio server is not defined', () => {
      // Set _studioServer to undefined
      (studioManager as any)._studioServer = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = vi.spyOn(studioManager as any, 'invokeSync')

      studioManager.updateSessionId('test-session-id')

      expect(invokeSyncSpy).not.toHaveBeenCalled()
    })

    it('does not call updateSessionId when _studioServer.updateSessionId is not a function', () => {
      // Set _studioServer.updateSessionId to undefined
      (studioManager as any)._studioServer.updateSessionId = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = vi.spyOn(studioManager as any, 'invokeSync')

      studioManager.updateSessionId('test-session-id')

      expect(invokeSyncSpy).not.toHaveBeenCalled()
    })
  })

  describe('reportError', () => {
    it('reports an error', () => {
      vi.spyOn(studio, 'reportError').mockImplementation(() => {})
      const error = new Error('foo')

      studioManager.reportError(error, 'reportError', 'test-args')

      expect(studio.reportError).toHaveBeenCalledWith(error, 'reportError', 'test-args')
    })
  })

  describe('destroy', () => {
    it('destroys the studio server', async () => {
      vi.spyOn(studio, 'destroy').mockResolvedValue(undefined)

      await studioManager.destroy()

      expect(studio.destroy).toHaveBeenCalled()
    })
  })

  describe('connectToBrowser', () => {
    it('calls connectToBrowser on the studio server', () => {
      const mockCDPClient = {
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      }

      vi.spyOn(studio, 'connectToBrowser').mockImplementation(() => {})

      studioManager.connectToBrowser(mockCDPClient as any)

      expect(studio.connectToBrowser).toHaveBeenCalledWith(mockCDPClient)
    })

    it('does not call connectToBrowser when studio server is not defined', () => {
      // Set _studioServer to undefined
      (studioManager as any)._studioServer = undefined

      // Create a spy on invokeSync to verify it's not called
      const invokeSyncSpy = vi.spyOn(studioManager as any, 'invokeSync')

      const mockCDPClient = {
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      }

      studioManager.connectToBrowser(mockCDPClient as any)

      expect(invokeSyncSpy).not.toHaveBeenCalled()
    })
  })
})
