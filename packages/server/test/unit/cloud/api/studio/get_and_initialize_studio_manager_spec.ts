import { Readable, Writable } from 'stream'
import { proxyquire, sinon } from '../../../../spec_helper'
import { HttpError } from '../../../../../lib/cloud/network/http_error'
import { CloudRequest } from '../../../../../lib/cloud/api/cloud_request'
import { isRetryableError } from '../../../../../lib/cloud/network/is_retryable_error'
import { asyncRetry } from '../../../../../lib/util/async_retry'
import { CloudDataSource } from '@packages/data-context/src/sources'

describe('getAndInitializeStudioManager', () => {
  let getAndInitializeStudioManager: typeof import('@packages/server/lib/cloud/api/studio/get_and_initialize_studio_manager').getAndInitializeStudioManager
  let rmStub: sinon.SinonStub = sinon.stub()
  let ensureStub: sinon.SinonStub = sinon.stub()
  let copyStub: sinon.SinonStub = sinon.stub()
  let readFileStub: sinon.SinonStub = sinon.stub()
  let crossFetchStub: sinon.SinonStub = sinon.stub()
  let createReadStreamStub: sinon.SinonStub = sinon.stub()
  let createWriteStreamStub: sinon.SinonStub = sinon.stub()
  let verifySignatureFromFileStub: sinon.SinonStub = sinon.stub()
  let extractStub: sinon.SinonStub = sinon.stub()
  let createInErrorManagerStub: sinon.SinonStub = sinon.stub()
  let tmpdir: string = '/tmp'
  let studioManagerSetupStub: sinon.SinonStub = sinon.stub()
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    rmStub = sinon.stub()
    ensureStub = sinon.stub()
    copyStub = sinon.stub()
    readFileStub = sinon.stub()
    crossFetchStub = sinon.stub().resolves({
      ok: true,
      statusText: 'OK',
    })

    createReadStreamStub = sinon.stub()
    createWriteStreamStub = sinon.stub()
    verifySignatureFromFileStub = sinon.stub()
    extractStub = sinon.stub()
    createInErrorManagerStub = sinon.stub()
    studioManagerSetupStub = sinon.stub()

    getAndInitializeStudioManager = (proxyquire('../lib/cloud/api/studio/get_and_initialize_studio_manager', {
      fs: {
        createReadStream: createReadStreamStub,
        createWriteStream: createWriteStreamStub,
      },
      os: {
        tmpdir: () => tmpdir,
        platform: () => 'linux',
      },
      'fs-extra': {
        remove: rmStub.resolves(),
        ensureDir: ensureStub.resolves(),
        copy: copyStub.resolves(),
        readFile: readFileStub.resolves('console.log("studio script")'),
      },
      tar: {
        extract: extractStub.resolves(),
      },
      '../../encryption': {
        verifySignatureFromFile: verifySignatureFromFileStub,
      },
      '../../studio': {
        StudioManager: class StudioManager {
          static createInErrorManager = createInErrorManagerStub
          setup = (...options) => studioManagerSetupStub(...options)
        },
      },
      'cross-fetch': crossFetchStub,
      '@packages/root': {
        version: '1.2.3',
      },
    }) as typeof import('@packages/server/lib/cloud/api/studio/get_and_initialize_studio_manager')).getAndInitializeStudioManager
  })

  afterEach(() => {
    process.env = originalEnv
    sinon.restore()
  })

  describe('CYPRESS_LOCAL_STUDIO_PATH is set', () => {
    beforeEach(() => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'
    })

    it('gets the studio bundle from the path specified in the environment variable', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      await getAndInitializeStudioManager({
        studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz',
        projectId: '12345',
        cloudDataSource: cloud,
        shouldEnableStudio: true,
      })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(copyStub).to.be.calledWith('/path/to/studio/app', '/tmp/cypress/studio/app')
      expect(copyStub).to.be.calledWith('/path/to/studio/server', '/tmp/cypress/studio/server')
      expect(readFileStub).to.be.calledWith('/tmp/cypress/studio/server/index.js', 'utf8')
      expect(studioManagerSetupStub).to.be.calledWithMatch({
        script: 'console.log("studio script")',
        studioPath: '/tmp/cypress/studio',
        studioHash: undefined,
        projectSlug: '12345',
        cloudApi: {
          cloudUrl: 'http://localhost:1234',
          cloudHeaders: {
            a: 'b',
            c: 'd',
          },
          CloudRequest,
          isRetryableError,
          asyncRetry,
        },
      })
    })
  })

  describe('CYPRESS_LOCAL_STUDIO_PATH not set', () => {
    let writeResult: string
    let readStream: Readable

    beforeEach(() => {
      readStream = Readable.from('console.log("studio script")')

      writeResult = ''
      const writeStream = new Writable({
        write: (chunk, encoding, callback) => {
          writeResult += chunk.toString()
          callback()
        },
      })

      createWriteStreamStub.returns(writeStream)
      createReadStreamStub.returns(Readable.from('tar contents'))
    })

    it('downloads the studio bundle and extracts it', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      crossFetchStub.resolves({
        ok: true,
        statusText: 'OK',
        body: readStream,
        headers: {
          get: (header) => {
            if (header === 'x-cypress-signature') {
              return '159'
            }
          },
        },
      })

      verifySignatureFromFileStub.resolves(true)

      const projectId = '12345'

      await getAndInitializeStudioManager({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, cloudDataSource: cloud, shouldEnableStudio: true })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')

      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
        agent: sinon.match.any,
        method: 'GET',
        headers: {
          'x-route-version': '1',
          'x-cypress-signature': '1',
          'x-cypress-project-slug': '12345',
          'x-cypress-studio-mount-version': '1',
          'x-os-name': 'linux',
          'x-cypress-version': '1.2.3',
        },
        encrypt: 'signed',
      })

      expect(writeResult).to.eq('console.log("studio script")')

      expect(verifySignatureFromFileStub).to.be.calledWith('/tmp/cypress/studio/bundle.tar', '159')

      expect(extractStub).to.be.calledWith({
        file: '/tmp/cypress/studio/bundle.tar',
        cwd: '/tmp/cypress/studio',
      })

      expect(readFileStub).to.be.calledWith('/tmp/cypress/studio/server/index.js', 'utf8')

      expect(studioManagerSetupStub).to.be.calledWithMatch({
        script: 'console.log("studio script")',
        studioPath: '/tmp/cypress/studio',
        studioHash: 'abc',
      })
    })

    it('downloads the studio bundle and extracts it after 1 fetch failure', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      crossFetchStub.onFirstCall().rejects(new HttpError('Failed to fetch', 'url', 502, 'Bad Gateway', 'Bad Gateway', sinon.stub()))
      crossFetchStub.onSecondCall().resolves({
        ok: true,
        statusText: 'OK',
        body: readStream,
        headers: {
          get: (header) => {
            if (header === 'x-cypress-signature') {
              return '159'
            }
          },
        },
      })

      verifySignatureFromFileStub.resolves(true)

      const projectId = '12345'

      await getAndInitializeStudioManager({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, cloudDataSource: cloud, shouldEnableStudio: true })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')

      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
        agent: sinon.match.any,
        method: 'GET',
        headers: {
          'x-route-version': '1',
          'x-cypress-signature': '1',
          'x-cypress-project-slug': '12345',
          'x-cypress-studio-mount-version': '1',
          'x-os-name': 'linux',
          'x-cypress-version': '1.2.3',
        },
        encrypt: 'signed',
      })

      expect(writeResult).to.eq('console.log("studio script")')

      expect(verifySignatureFromFileStub).to.be.calledWith('/tmp/cypress/studio/bundle.tar', '159')

      expect(extractStub).to.be.calledWith({
        file: '/tmp/cypress/studio/bundle.tar',
        cwd: '/tmp/cypress/studio',
      })

      expect(readFileStub).to.be.calledWith('/tmp/cypress/studio/server/index.js', 'utf8')

      expect(studioManagerSetupStub).to.be.calledWithMatch({
        script: 'console.log("studio script")',
        studioPath: '/tmp/cypress/studio',
        studioHash: 'abc',
      })
    })

    it('throws an error and returns a studio manager in error state if the fetch fails more than twice', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      const error = new HttpError('Failed to fetch', 'url', 502, 'Bad Gateway', 'Bad Gateway', sinon.stub())

      crossFetchStub.rejects(error)

      const projectId = '12345'

      await getAndInitializeStudioManager({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, cloudDataSource: cloud, shouldEnableStudio: true })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')

      expect(crossFetchStub).to.be.calledThrice
      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
        agent: sinon.match.any,
        method: 'GET',
        headers: {
          'x-route-version': '1',
          'x-cypress-signature': '1',
          'x-cypress-project-slug': '12345',
          'x-cypress-studio-mount-version': '1',
          'x-os-name': 'linux',
          'x-cypress-version': '1.2.3',
        },
        encrypt: 'signed',
      })

      expect(createInErrorManagerStub).to.be.calledWithMatch({
        error: sinon.match.instanceOf(AggregateError),
        cloudApi: {
          cloudUrl: 'http://localhost:1234',
          cloudHeaders: {
            a: 'b',
            c: 'd',
          },
        },
        studioHash: undefined,
        projectSlug: '12345',
        studioMethod: 'getAndInitializeStudioManager',
      })
    })

    it('throws an error and returns a studio manager in error state if the response status is not ok', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      crossFetchStub.resolves({
        ok: false,
        statusText: 'Some failure',
      })

      const projectId = '12345'

      await getAndInitializeStudioManager({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, cloudDataSource: cloud, shouldEnableStudio: true })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(createInErrorManagerStub).to.be.calledWithMatch({
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Failed to download studio bundle: Some failure')),
        cloudApi: {
          cloudUrl: 'http://localhost:1234',
          cloudHeaders: { a: 'b', c: 'd' },
        },
        studioHash: undefined,
        projectSlug: '12345',
        studioMethod: 'getAndInitializeStudioManager',
      })
    })

    it('throws an error and returns a studio manager in error state if the signature verification fails', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      crossFetchStub.resolves({
        ok: true,
        statusText: 'OK',
        body: readStream,
        headers: {
          get: (header) => {
            if (header === 'x-cypress-signature') {
              return '159'
            }
          },
        },
      })

      verifySignatureFromFileStub.resolves(false)

      const projectId = '12345'

      await getAndInitializeStudioManager({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, cloudDataSource: cloud, shouldEnableStudio: true })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(writeResult).to.eq('console.log("studio script")')

      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
        agent: sinon.match.any,
        method: 'GET',
        headers: {
          'x-route-version': '1',
          'x-cypress-signature': '1',
          'x-cypress-project-slug': '12345',
          'x-cypress-studio-mount-version': '1',
          'x-os-name': 'linux',
          'x-cypress-version': '1.2.3',
        },
        encrypt: 'signed',
      })

      expect(verifySignatureFromFileStub).to.be.calledWith('/tmp/cypress/studio/bundle.tar', '159')
      expect(createInErrorManagerStub).to.be.calledWithMatch({
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Unable to verify studio signature')),
        cloudApi: {
          cloudUrl: 'http://localhost:1234',
          cloudHeaders: { a: 'b', c: 'd' },
        },
        studioHash: undefined,
        projectSlug: '12345',
        studioMethod: 'getAndInitializeStudioManager',
      })
    })

    it('throws an error if there is no signature in the response headers', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      crossFetchStub.resolves({
        ok: true,
        statusText: 'OK',
        body: readStream,
        headers: {
          get: () => null,
        },
      })

      const projectId = '12345'

      await getAndInitializeStudioManager({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, cloudDataSource: cloud, shouldEnableStudio: true })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(createInErrorManagerStub).to.be.calledWithMatch({
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Unable to get studio signature')),
        cloudApi: {
          cloudUrl: 'http://localhost:1234',
          cloudHeaders: { a: 'b', c: 'd' },
        },
        studioHash: undefined,
        projectSlug: '12345',
        studioMethod: 'getAndInitializeStudioManager',
      })
    })

    it('throws an error if downloading the studio bundle takes too long', async () => {
      const mockGetCloudUrl = sinon.stub()
      const mockAdditionalHeaders = sinon.stub()
      const cloud = {
        getCloudUrl: mockGetCloudUrl,
        additionalHeaders: mockAdditionalHeaders,
      } as unknown as CloudDataSource

      mockGetCloudUrl.returns('http://localhost:1234')
      mockAdditionalHeaders.resolves({
        a: 'b',
        c: 'd',
      })

      // Create a promise that never resolves to simulate timeout
      crossFetchStub.returns(new Promise(() => {
        // This promise deliberately never resolves
      }))

      const projectId = '12345'

      // pass shorter timeout for testing
      await getAndInitializeStudioManager({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, cloudDataSource: cloud, shouldEnableStudio: true, downloadTimeoutMs: 3000 })

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(createInErrorManagerStub).to.be.calledWithMatch({
        error: sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Cloud studio download timed out')),
        cloudApi: {
          cloudUrl: 'http://localhost:1234',
          cloudHeaders: { a: 'b', c: 'd' },
        },
        studioHash: undefined,
        projectSlug: '12345',
        studioMethod: 'getAndInitializeStudioManager',
      })
    })
  })
})
