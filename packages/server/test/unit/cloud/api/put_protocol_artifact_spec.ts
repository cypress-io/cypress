import mockery from 'mockery'
import { enable as enableMockery, mockElectron } from '../../../mockery_helper'
import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

import { ReadStream } from 'fs'
import { StreamActivityMonitor } from '../../../../lib/cloud/upload/stream_activity_monitor'
import { uploadStream } from '../../../../lib/cloud/upload/upload_stream'
import { HttpError } from '../../../../lib/cloud/api/http_error'

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

  /**
   * global.mockery is defined the first time `test/spec_helper.js` is required by any spec.
   * Unfortunately, the only way to fully reset a mocked dependency with mockery is to
   * disable it in an `afterEach` (see the afterEach hook of this describe).
   * because global mockery is enabled once for the entire spec run, this kind of post-spec
   * state reset fails in dramatic ways, often in specs unrelated to this spec.
   *
   * To get around this suite-wide failure condition, this spec disables the global mockery
   * once before running any of its tests, and re-enables it after it finishes. This is kind
   * of an inverse of setting/clearing state before/after tests: we're cleaing global state,
   * and then re-setting global state. The alternative to be able to use mockery in this spec
   * was to refactor all other specs to not rely on spec_helper. Some specs rely on spec_helper
   * only implicitly, though, so the scope of that refactor is difficult to determine.
   */
  before(() => {
    if (global.mockery) {
      global.mockery.disable()
    }
  })

  after(() => {
    if (global.mockery) {
      enableMockery(global.mockery)
      mockElectron(global.mockery)
    }
  })

  beforeEach(() => {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false,
    })

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
      let httpErr: HttpError
      let res: Response

      beforeEach(() => {
        res = sinon.createStubInstance(Response)

        httpErr = new HttpError(`403 Forbidden (${destinationUrl})`, res)

        uploadStreamStub.withArgs(
          mockReadStream,
          destinationUrl,
          fileSize, {
            retryDelay: geometricRetryStub,
            activityMonitor: mockStreamMonitor,
          },
        ).rejects(httpErr)
      })

      it('rethrows', async () => {
        let error: Error | undefined

        try {
          await putProtocolArtifact(filePath, maxFileSize, destinationUrl)
        } catch (e) {
          error = e
        }
        expect(error).to.eq(httpErr)
      })
    })
  })
})
