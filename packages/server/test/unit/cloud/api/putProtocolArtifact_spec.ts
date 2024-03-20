import mockery from 'mockery'
import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

import { ReadStream } from 'fs'
import { StreamActivityMonitor } from '../../../../lib/cloud/upload/StreamActivityMonitor'
import { HttpError, uploadStream } from '../../../../lib/cloud/upload/uploadStream'

chai.use(chaiAsPromised).use(sinonChai)

describe('putProtocolArtifact', () => {
  let filePath: string
  let maxFileSize: number
  let fileSize: number
  let mockStreamMonitor
  let mockReadStream
  let destinationUrl

  let statStub: sinon.SinonStub
  let uploadStreamStub: sinon.SinonStub<Parameters<typeof uploadStream>, ReturnType<typeof uploadStream>>
  let geometricRetryStub: sinon.SinonStub

  let putProtocolArtifact: (artifactPath: string, maxFileSize: number, destinationUrl: string) => Promise<void>

  beforeEach(() => {
    mockery.enable({ useCleanCache: true })
    mockery.registerAllowables(['../../../../lib/cloud/api/putProtocolArtifact', 'tslib'])

    maxFileSize = 20000
    filePath = '/some/file/path'
    fileSize = 20
    destinationUrl = 'https://some/destination/url'

    mockReadStream = sinon.createStubInstance(ReadStream)
    mockery.registerMock('fs', {
      createReadStream: sinon.stub().returns(mockReadStream),
    })

    geometricRetryStub = sinon.stub()

    uploadStreamStub = sinon.stub<Parameters<typeof uploadStream>, ReturnType<typeof uploadStream>>()

    // these paths need to be what `putProtocolArtifact` used to import them
    mockery.registerMock('../upload/uploadStream', {
      geometricRetry: geometricRetryStub,
      uploadStream: uploadStreamStub,
    })

    mockStreamMonitor = sinon.createStubInstance(StreamActivityMonitor)
    mockery.registerMock('../upload/StreamActivityMonitor', {
      StreamActivityMonitor: sinon.stub().callsFake(() => {
        return mockStreamMonitor
      }),
    })

    statStub = sinon.stub()

    mockery.registerMock('fs/promises', {
      stat: statStub,
    })

    putProtocolArtifact = require('../../../../lib/cloud/api/putProtocolArtifact').putProtocolArtifact
  })

  afterEach(() => {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('when provided an artifact path that does not exist', () => {
    let invalidPath: string

    beforeEach(() => {
      invalidPath = '/some/invalid/path'

      statStub.withArgs(invalidPath).callsFake((path) => {
        const e = new Error(`ENOENT: no such file or directory, stat '${path}'`)

        // no way to instantiate system errors like ENOENT in TS -
        // there is no exported system error interface
        // @ts-ignore
        e.errno = -2
        // @ts-ignore
        e.code = 'ENOENT'
        // @ts-ignore
        e.syscall = 'stat'
        // @ts-ignore
        e.path = path

        return Promise.reject(e)
      })
    })

    it('rejects with a file does not exist error', () => {
      return expect(putProtocolArtifact(invalidPath, maxFileSize, destinationUrl)).to.be.rejectedWith(`ENOENT: no such file or directory, stat '/some/invalid/path'`)
    })
  })

  describe('when provided a valid artifact path', () => {
    beforeEach(() => {
      statStub.withArgs(filePath).resolves({ size: fileSize })
    })

    describe('and the artifact is too large', () => {
      beforeEach(() => {
        maxFileSize = fileSize - 1
      })

      it('rejects with a file too large error', () => {
        return expect(putProtocolArtifact(filePath, maxFileSize, destinationUrl))
        .to.be.rejectedWith('Spec recording too large: artifact is 20 bytes, limit is 19 bytes')
      })
    })

    describe('and fetch completes successfully', () => {
      it('resolves', () => {
        uploadStreamStub.withArgs(
          mockReadStream,
          destinationUrl,
          fileSize, {
            retryDelay: geometricRetryStub,
            activityMonitor: mockStreamMonitor,
          },
        ).resolves()

        return expect(putProtocolArtifact(filePath, maxFileSize, destinationUrl)).to.be.fulfilled
      })
    })

    describe('and uploadStream rejects', () => {
      let networkError: HttpError

      beforeEach(() => {
        networkError = new HttpError(403, 'Forbidden', destinationUrl)

        uploadStreamStub.withArgs(
          mockReadStream,
          destinationUrl,
          fileSize, {
            retryDelay: geometricRetryStub,
            activityMonitor: mockStreamMonitor,
          },
        ).rejects(networkError)
      })

      it('rethrows', () => {
        return expect(putProtocolArtifact(filePath, maxFileSize, destinationUrl)).to.be.rejectedWith('403: Forbidden')
      })
    })
  })
})
