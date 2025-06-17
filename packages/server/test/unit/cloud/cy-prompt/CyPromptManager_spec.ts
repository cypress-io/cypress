import { proxyquire, sinon } from '../../../spec_helper'
import path from 'path'
import type { CyPromptServerShape } from '@packages/types'
import { expect } from 'chai'
import esbuild from 'esbuild'
import type { CyPromptManager as CyPromptManagerShape } from '@packages/server/lib/cloud/cy-prompt/CyPromptManager'
import os from 'os'

const { outputFiles: [{ contents: stubCyPromptRaw }] } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', '..', '..', 'support', 'fixtures', 'cloud', 'cy-prompt', 'test-cy-prompt.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
})
const stubCyPrompt = new TextDecoder('utf-8').decode(stubCyPromptRaw)

describe('lib/cloud/cy-prompt', () => {
  let cyPromptManager: CyPromptManagerShape
  let cyPrompt: CyPromptServerShape
  let CyPromptManager: typeof import('@packages/server/lib/cloud/cy-prompt/CyPromptManager').CyPromptManager

  beforeEach(async () => {
    CyPromptManager = (proxyquire('../lib/cloud/cy-prompt/CyPromptManager', {
    }) as typeof import('@packages/server/lib/cloud/cy-prompt/CyPromptManager')).CyPromptManager

    cyPromptManager = new CyPromptManager()
    await cyPromptManager.setup({
      script: stubCyPrompt,
      cyPromptPath: 'path',
      cyPromptHash: 'abcdefg',
      projectSlug: '1234',
      cloudApi: {} as any,
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

    sinon.stub(os, 'platform').returns('darwin')
    sinon.stub(os, 'arch').returns('x64')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('synchronous method invocation', () => {
    it('reports an error when a synchronous method fails', () => {
      const error = new Error('foo')

      sinon.stub(cyPrompt, 'initializeRoutes').throws(error)

      cyPromptManager.initializeRoutes({} as any)

      expect(cyPromptManager.status).to.eq('IN_ERROR')

      // TODO: (cy.prompt) test that the error is reported
    })
  })

  describe('initializeRoutes', () => {
    it('initializes routes', () => {
      sinon.stub(cyPrompt, 'initializeRoutes')
      const mockRouter = sinon.stub()

      cyPromptManager.initializeRoutes(mockRouter)

      expect(cyPrompt.initializeRoutes).to.be.calledWith(mockRouter)
    })
  })

  describe('addSocketListeners', () => {
    it('adds socket listeners', () => {
      sinon.stub(cyPrompt, 'addSocketListeners')
      const mockSocket = sinon.stub()

      cyPromptManager.addSocketListeners(mockSocket)

      expect(cyPrompt.addSocketListeners).to.be.calledWith(mockSocket)
    })
  })

  describe('connectToBrowser', () => {
    it('connects to the browser', () => {
      const mockCriClient = {
        send: sinon.stub().resolves(),
        on: sinon.stub().resolves(),
      }

      sinon.stub(cyPrompt, 'connectToBrowser')

      cyPromptManager.connectToBrowser(mockCriClient)

      expect(cyPrompt.connectToBrowser).to.be.calledWith(mockCriClient)
    })

    it('does not call connectToBrowser when cy prompt server is not defined', () => {
      // Set _cyPromptServer to undefined
      (cyPromptManager as any)._cyPromptServer = undefined

      const invokeSyncSpy = sinon.spy(cyPromptManager, 'invokeSync')

      cyPromptManager.connectToBrowser({} as any)

      expect(invokeSyncSpy).to.not.be.called
    })
  })

  describe('reset', () => {
    it('calls reset', () => {
      sinon.stub(cyPrompt, 'reset')

      cyPromptManager.reset()

      expect(cyPrompt.reset).to.be.called
    })

    it('calls resert with an id', () => {
      sinon.stub(cyPrompt, 'reset')

      cyPromptManager.reset('r1')

      expect(cyPrompt.reset).to.be.calledWith('r1')
    })
  })
})
