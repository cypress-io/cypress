import mockery from 'mockery'
import { enable as enableMockery, mockElectron } from '../../../mockery_helper'
import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

import { ReadStream } from 'fs'
import { StreamActivityMonitor } from '../../../../lib/cloud/upload/stream_activity_monitor'
import { HttpError } from '../../../../lib/cloud/network/http_error'
import { putFetch, ParseKinds } from '../../../../lib/cloud/network/put_fetch'
import { linearDelay, asyncRetry } from '../../../../lib/util/async_retry'
import { isRetryableError } from '../../../../lib/cloud/network/is_retryable_error'
import type { putProtocolArtifact } from '../../../../lib/cloud/api/put_protocol_artifact'

chai.use(chaiAsPromised).use(sinonChai)

describe('putProtocolArtifact', () => {
  let filePath: string
  let maxFileSize: number
  let fileSize: number
  let uploadMonitorSamplingRate: number
  let mockStreamMonitor: sinon.SinonStubbedInstance<StreamActivityMonitor>
  let mockReadStream
  let destinationUrl
  let statStub: sinon.SinonStub
  let asyncRetryStub: sinon.SinonStub<Parameters<typeof asyncRetry>, ReturnType<typeof asyncRetry>>
  let putFetchStub: sinon.SinonStub<Parameters<typeof putFetch>, ReturnType<typeof putFetch>>
  let putArtifact: typeof putProtocolArtifact
  let streamMonitorImport: {
    StreamActivityMonitor: sinon.SinonStub<[maxActivityDwellTime: number], StreamActivityMonitor>
  }

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
    uploadMonitorSamplingRate = 10000

    mockReadStream = sinon.createStubInstance(ReadStream)
    mockery.registerMock('fs', {
      createReadStream: sinon.stub().returns(mockReadStream),
    })

    putFetchStub = sinon.stub()

    mockery.registerMock('../network/put_fetch', {
      putFetch: putFetchStub,
      ParseKinds,
    })

    asyncRetryStub = sinon.stub()

    // asyncRetry is already unit tested, no need to test retry behavior: identity stub
    asyncRetryStub.callsFake((fn) => fn)

    mockery.registerMock('../../util/async_retry', {
      asyncRetry: asyncRetryStub,
      linearDelay,
    })

    const mockAbortController = sinon.createStubInstance(AbortController)
    const mockSignal = sinon.createStubInstance(AbortSignal)

    sinon.stub(mockAbortController, 'signal').get(() => mockSignal)

    streamMonitorImport = {
      StreamActivityMonitor: sinon.stub<[maxActivityDwellTime: number], StreamActivityMonitor>().callsFake(() => {
        return mockStreamMonitor
      }),
    }

    mockStreamMonitor = sinon.createStubInstance(StreamActivityMonitor)
    mockStreamMonitor.getController.returns(mockAbortController)

    mockery.registerMock('../upload/stream_activity_monitor', streamMonitorImport)

    statStub = sinon.stub()

    mockery.registerMock('fs/promises', {
      stat: statStub,
    })

    const req = require('../../../../lib/cloud/api/put_protocol_artifact')

    putArtifact = req.putProtocolArtifact
  })

  afterEach(() => {
    mockery.deregisterAll()
    mockery.disable()
  })

  it('is wrapped with an asyncRetry', () => {
    const options = asyncRetryStub.firstCall.args[1]

    expect(options.maxAttempts).to.eq(3)
    expect(options.retryDelay).to.be.a('function')
    // because of mockery, the isRetryableError ref here is different than the one imported into put_protocol_artifact_spec
    expect(options.shouldRetry?.toString()).to.eq(isRetryableError.toString())
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
      return expect(putArtifact(invalidPath, maxFileSize, destinationUrl, uploadMonitorSamplingRate)).to.be.rejectedWith(`ENOENT: no such file or directory, stat '/some/invalid/path'`)
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
        return expect(putArtifact(filePath, maxFileSize, destinationUrl, uploadMonitorSamplingRate))
        .to.be.rejectedWith('Spec recording too large: artifact is 20 bytes, limit is 19 bytes')
      })
    })

    describe('and fetch completes successfully', () => {
      beforeEach(() => {
        putFetchStub.resolves()
      })

      it('creates the stream activity monitor with the provided sampling interval and resolves', async () => {
        await expect(putArtifact(filePath, maxFileSize, destinationUrl, uploadMonitorSamplingRate)).to.be.fulfilled

        expect(streamMonitorImport.StreamActivityMonitor).to.have.been.calledWith(uploadMonitorSamplingRate)
      })
    })

    describe('and putFetch rejects', () => {
      let httpErr: HttpError
      let res: Response

      beforeEach(() => {
        res = sinon.createStubInstance(Response)

        httpErr = new HttpError(
          `403 Forbidden (${destinationUrl})`,
          destinationUrl,
          403,
          'Forbidden',
          'Response Body',
          res,
        )

        putFetchStub.rejects(httpErr)
      })

      it('rethrows', async () => {
        let error: Error | undefined

        try {
          await putArtifact(filePath, maxFileSize, destinationUrl)
        } catch (e) {
          error = e
        }
        expect(error).to.eq(httpErr)
      })
    })
  })
})
