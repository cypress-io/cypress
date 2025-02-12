import { proxyquire, sinon } from '../../spec_helper'
import path from 'path'
import type { AppStudioShape } from '@packages/types'
import { expect } from 'chai'
import esbuild from 'esbuild'
import type { StudioManager as StudioManagerShape } from '@packages/server/lib/cloud/studio'
import os from 'os'

const pkg = require('@packages/root')

const { outputFiles: [{ contents: stubStudioRaw }] } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'studio', 'test-studio.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
})
const stubStudio = new TextDecoder('utf-8').decode(stubStudioRaw)

describe('lib/cloud/studio', () => {
  let stubbedCrossFetch: sinon.SinonStub
  let studioManager: StudioManagerShape
  let studio: AppStudioShape
  let StudioManager: typeof import('@packages/server/lib/cloud/studio').StudioManager

  beforeEach(() => {
    stubbedCrossFetch = sinon.stub()
    StudioManager = (proxyquire('../lib/cloud/studio', {
      'cross-fetch': stubbedCrossFetch,
    }) as typeof import('@packages/server/lib/cloud/studio')).StudioManager

    studioManager = new StudioManager()
    studioManager.setup({ script: stubStudio, studioPath: 'path', studioHash: 'abcdefg' })
    studio = (studioManager as any)._appStudio

    sinon.stub(os, 'platform').returns('darwin')
    sinon.stub(os, 'arch').returns('x64')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('synchronous method invocation', () => {
    it('reports an error when a synchronous method fails', async () => {
      const error = new Error('foo')

      sinon.stub(studio, 'initializeRoutes').throws(error)

      await studioManager.initializeRoutes({} as any)

      expect(studioManager.status).to.eq('IN_ERROR')
      expect(stubbedCrossFetch).to.be.calledWithMatch(sinon.match((url: string) => url.endsWith('/studio/errors')), {
        agent: sinon.match.any,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cypress-version': pkg.version,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
        },
        body: sinon.match((body) => {
          const parsedBody = JSON.parse(body)

          expect(parsedBody.studioHash).to.eq('abcdefg')
          expect(parsedBody.errors[0].name).to.eq(error.name)
          expect(parsedBody.errors[0].stack).to.eq(error.stack)
          expect(parsedBody.errors[0].message).to.eq(error.message)

          return true
        }),
      })
    })
  })

  describe('createInErrorManager', () => {
    it('creates a studio manager in error state', () => {
      const manager = StudioManager.createInErrorManager(new Error('foo'))

      expect(manager.status).to.eq('IN_ERROR')

      expect(stubbedCrossFetch).to.be.calledWithMatch(sinon.match((url: string) => url.endsWith('/studio/errors')), {
        agent: sinon.match.any,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cypress-version': pkg.version,
          'x-os-name': 'darwin',
          'x-arch': 'x64',
        },
        body: sinon.match((body) => {
          const parsedBody = JSON.parse(body)

          expect(parsedBody.studioHash).to.be.undefined
          expect(parsedBody.errors[0].name).to.eq('Error')
          expect(parsedBody.errors[0].stack).to.be.a('string')
          expect(parsedBody.errors[0].message).to.eq('foo')

          return true
        }),
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
})
