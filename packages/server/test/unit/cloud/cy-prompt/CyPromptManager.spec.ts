import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import type { CyPromptServerShape } from '@packages/types'
import esbuild from 'esbuild'
import os from 'os'
import { CyPromptManager } from '../../../../lib/cloud/cy-prompt/CyPromptManager'

const { outputFiles: [{ contents: stubCyPromptRaw }] } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', '..', '..', 'support', 'fixtures', 'cloud', 'cy-prompt', 'test-cy-prompt.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
})
const stubCyPrompt = new TextDecoder('utf-8').decode(stubCyPromptRaw)

describe('lib/cloud/cy-prompt', () => {
  let cyPromptManager: CyPromptManager
  let cyPrompt: CyPromptServerShape

  beforeEach(async () => {
    cyPromptManager = new CyPromptManager()
    await cyPromptManager.setup({
      script: stubCyPrompt,
      cyPromptPath: 'path',
      cyPromptHash: 'abcdefg',
      projectSlug: '1234',
      cloudApi: {} as any,
      manifest: {
        'server/index.js': 'abcdefg',
      },
      getProjectOptions: () => {
        return Promise.resolve({
          user: {
            id: '1234',
            email: 'test@test.com',
            name: 'test',
          },
          projectSlug: '1234',
          record: false,
        })
      },
    })

    cyPrompt = (cyPromptManager as any)._cyPromptServer

    vi.spyOn(os, 'platform').mockReturnValue('darwin')
    vi.spyOn(os, 'arch').mockReturnValue('x64')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('synchronous method invocation', () => {
    it('reports an error when a synchronous method fails', () => {
      const error = new Error('foo')

      vi.spyOn(cyPrompt, 'initializeRoutes').mockImplementation(() => {
        throw error
      })

      cyPromptManager.initializeRoutes({} as any)

      expect(cyPromptManager.status).toBe('IN_ERROR')

      // TODO: (cy.prompt) test that the error is reported
    })

    // the Cloud ships the cy prompt server as a class instance whose methods rely on `this`
    it('invokes the method on the cy prompt server instance', () => {
      const initializeRoutes = vi.spyOn(cyPrompt, 'initializeRoutes').mockImplementation(() => {})

      cyPromptManager.initializeRoutes({} as any)

      expect(initializeRoutes.mock.contexts).toContain(cyPrompt)
    })

    it('forwards each argument individually rather than as an array', () => {
      const reset = vi.spyOn(cyPrompt, 'reset').mockImplementation(() => {})

      cyPromptManager.reset('r1')

      expect(reset.mock.contexts).toContain(cyPrompt)
      expect(reset).toHaveBeenCalledWith('r1')
    })
  })

  describe('initializeRoutes', () => {
    it('initializes routes', () => {
      vi.spyOn(cyPrompt, 'initializeRoutes').mockImplementation(() => {})
      const mockRouter = vi.fn()

      cyPromptManager.initializeRoutes(mockRouter as any)

      expect(cyPrompt.initializeRoutes).toHaveBeenCalledWith(mockRouter)
    })
  })

  describe('addSocketListeners', () => {
    it('adds socket listeners', () => {
      vi.spyOn(cyPrompt, 'addSocketListeners').mockImplementation(() => {})
      const mockSocket = vi.fn()

      cyPromptManager.addSocketListeners(mockSocket as any)

      expect(cyPrompt.addSocketListeners).toHaveBeenCalledWith(mockSocket)
    })
  })

  describe('connectToBrowser', () => {
    it('connects to the browser', () => {
      const mockCriClient = {
        send: vi.fn().mockResolvedValue(undefined),
        on: vi.fn().mockResolvedValue(undefined),
      }

      vi.spyOn(cyPrompt, 'connectToBrowser').mockImplementation(() => {})

      cyPromptManager.connectToBrowser(mockCriClient as any)

      expect(cyPrompt.connectToBrowser).toHaveBeenCalledWith(mockCriClient)
    })

    it('does not call connectToBrowser when cy prompt server is not defined', () => {
      // Set _cyPromptServer to undefined
      (cyPromptManager as any)._cyPromptServer = undefined

      const invokeSyncSpy = vi.spyOn(cyPromptManager as any, 'invokeSync')

      cyPromptManager.connectToBrowser({} as any)

      expect(invokeSyncSpy).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('calls reset', () => {
      vi.spyOn(cyPrompt, 'reset').mockImplementation(() => {})

      cyPromptManager.reset()

      expect(cyPrompt.reset).toHaveBeenCalled()
    })

    it('calls resert with an id', () => {
      vi.spyOn(cyPrompt, 'reset').mockImplementation(() => {})

      cyPromptManager.reset('r1')

      expect(cyPrompt.reset).toHaveBeenCalledWith('r1')
    })
  })
})
