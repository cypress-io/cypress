import { Readable, Writable } from 'stream'
import { proxyquire, sinon } from '../../../spec_helper'
import { HttpError } from '../../../../lib/cloud/network/http_error'

describe('getAppStudio', () => {
  let getAppStudio: typeof import('@packages/server/lib/cloud/api/get_app_studio').getAppStudio
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

  beforeEach(() => {
    rmStub = sinon.stub()
    ensureStub = sinon.stub()
    copyStub = sinon.stub()
    readFileStub = sinon.stub()
    crossFetchStub = sinon.stub()
    createReadStreamStub = sinon.stub()
    createWriteStreamStub = sinon.stub()
    verifySignatureFromFileStub = sinon.stub()
    extractStub = sinon.stub()
    createInErrorManagerStub = sinon.stub()
    studioManagerSetupStub = sinon.stub()

    getAppStudio = (proxyquire('../lib/cloud/api/get_app_studio', {
      fs: {
        promises: {
          rm: rmStub.resolves(),
        },
        createReadStream: createReadStreamStub,
        createWriteStream: createWriteStreamStub,
      },
      os: {
        tmpdir: () => tmpdir,
        platform: () => 'linux',
      },
      'fs-extra': {
        ensureDir: ensureStub.resolves(),
        copy: copyStub.resolves(),
        readFile: readFileStub.resolves('console.log("studio script")'),
      },
      tar: {
        extract: extractStub.resolves(),
      },
      '../encryption': {
        verifySignatureFromFile: verifySignatureFromFileStub,
      },
      '../studio': {
        StudioManager: class StudioManager {
          static createInErrorManager = createInErrorManagerStub
          setup = (...options) => studioManagerSetupStub(...options)
        },
      },
      'cross-fetch': crossFetchStub,
      '@packages/root': {
        version: '1.2.3',
      },
    }) as typeof import('@packages/server/lib/cloud/api/get_app_studio')).getAppStudio
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('CYPRESS_LOCAL_STUDIO_PATH is set', () => {
    beforeEach(() => {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'
    })

    it('gets the studio bundle from the path specified in the environment variable', async () => {
      await getAppStudio()

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(copyStub).to.be.calledWith('/path/to/studio/app', '/tmp/cypress/studio/app')
      expect(copyStub).to.be.calledWith('/path/to/studio/server', '/tmp/cypress/studio/server')
      expect(readFileStub).to.be.calledWith('/tmp/cypress/studio/server/index.js', 'utf8')
      expect(studioManagerSetupStub).to.be.calledWithMatch({
        script: 'console.log("studio script")',
        studioPath: '/tmp/cypress/studio',
        studioHash: undefined,
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
      crossFetchStub.resolves({
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

      await getAppStudio(projectId)

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')

      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/current.tgz', {
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
        studioHash: 'V8T1PKuSTK1h9gr-1Z2Wtx__bxTpCXWRZ57sKmPVTSs',
      })
    })

    it('downloads the studio bundle and extracts it after 1 fetch failure', async () => {
      crossFetchStub.onFirstCall().rejects(new HttpError('Failed to fetch', 'url', 502, 'Bad Gateway', 'Bad Gateway', sinon.stub()))
      crossFetchStub.onSecondCall().resolves({
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

      await getAppStudio(projectId)

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')

      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/current.tgz', {
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
        studioHash: 'V8T1PKuSTK1h9gr-1Z2Wtx__bxTpCXWRZ57sKmPVTSs',
      })
    })

    it('throws an error and returns a studio manager in error state if the fetch fails more than twice', async () => {
      const error = new HttpError('Failed to fetch', 'url', 502, 'Bad Gateway', 'Bad Gateway', sinon.stub())

      crossFetchStub.rejects(error)

      const projectId = '12345'

      await getAppStudio(projectId)

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')

      expect(crossFetchStub).to.be.calledThrice
      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/current.tgz', {
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

      expect(createInErrorManagerStub).to.be.calledWithMatch(sinon.match.instanceOf(AggregateError))
    })

    it('throws an error and returns a studio manager in error state if the signature verification fails', async () => {
      crossFetchStub.resolves({
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

      await getAppStudio(projectId)

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(writeResult).to.eq('console.log("studio script")')

      expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/current.tgz', {
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
      expect(createInErrorManagerStub).to.be.calledWithMatch(sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Unable to verify studio signature')))
    })

    it('throws an error if there is no signature in the response headers', async () => {
      crossFetchStub.resolves({
        body: readStream,
        headers: {
          get: () => null,
        },
      })

      const projectId = '12345'

      await getAppStudio(projectId)

      expect(rmStub).to.be.calledWith('/tmp/cypress/studio')
      expect(ensureStub).to.be.calledWith('/tmp/cypress/studio')
      expect(createInErrorManagerStub).to.be.calledWithMatch(sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Unable to get studio signature')))
    })
  })
})
