import { ReadStream } from 'fs'
import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { uploadStream, geometricRetry, HttpError } from '../../../../lib/cloud/upload/uploadStream'
import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import { StreamActivityMonitor, StreamStalledError, StreamStartTimedOutError } from '../../../../lib/cloud/upload/StreamActivityMonitor'

chai.use(chaiAsPromised).use(sinonChai)

import nock from 'nock'

describe('geometricRetry', () => {
  it('returns a geometrically increasing n', () => {
    expect(geometricRetry(0)).to.eq(500)
    expect(geometricRetry(1)).to.eq(1000)
    expect(geometricRetry(2)).to.eq(1500)
  })
})

describe('uploadStream', () => {
  let destinationUrl: string
  let destinationPath: string
  let destinationDomain: string
  let uploadPromise: Promise<any>
  let scope: nock.Scope
  let fileSize: number
  let fsReadStream: ReadStream
  let fileStreamController: ReadableStreamDefaultController
  let fileContents: string
  let fileReadableStream: ReadableStream

  function noopRetry (n: number): number {
    return n
  }

  function execSimpleStream () {
    fileStreamController.enqueue(fileContents)
    fileStreamController.close()
  }

  function mockUpload () {
    return scope.put(destinationPath, undefined, {
      reqheaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-tar',
        'Content-Length': fileSize.toString(),
      },
    })
  }

  beforeEach(() => {
    fileContents = 'lorem ipsum dolor set'
    fileSize = fileContents.length

    fileReadableStream = new ReadableStream({
      start (controller) {
        fileStreamController = controller
      },
    })

    fsReadStream = sinon.createStubInstance(ReadStream)

    sinon.stub(Readable, 'toWeb').withArgs(fsReadStream).callsFake(() => {
      return fileReadableStream
    })

    destinationDomain = 'http://somedomain.test:80'
    destinationPath = '/upload'
    destinationUrl = `${destinationDomain}${destinationPath}`
    scope = nock(destinationDomain)
  })

  afterEach(() => {
    nock.cleanAll()

    ;(Readable.toWeb as sinon.SinonStub).restore()
  })

  describe('when fetch resolves with a 200 OK', () => {
    beforeEach(() => {
      mockUpload().reply(200, 'OK')
    })

    it(`resolves`, async () => {
      uploadPromise = uploadStream(fsReadStream, destinationUrl, fileSize, noopRetry)
      execSimpleStream()

      await expect(uploadPromise).to.be.fulfilled
    })
  })

  describe('when fetch resolves with a 4xx/5xx response', () => {
    const status = 403

    beforeEach(() => {
      mockUpload().reply(status)
    })

    it('rejects with an appropriate HttpError', async () => {
      const uploadPromise = uploadStream(fsReadStream, destinationUrl, fileSize, noopRetry)

      execSimpleStream()

      await expect(uploadPromise).to.eventually.be.rejectedWith(HttpError, '403: Forbidden')
    })
  })

  describe('retry behavior', () => {
    describe('when fetch resolves with a retryable http status code 3 times', () => {
      const callCount = 3

      /*
    ;[408, 429, 502, 503, 504].forEach((status) => {
      */
      const status = 408

      it(`makes a total of ${callCount} calls for HTTP ${status} and eventually rejects`, async () => {
        let count = 0

        const inc = () => {
          count++
        }

        mockUpload().times(4).reply(status, inc)

        const uploadPromise = uploadStream(fsReadStream, destinationUrl, fileSize, noopRetry)

        execSimpleStream()

        await expect(uploadPromise).to.eventually.be.rejectedWith(HttpError)
        expect(count).to.eq(callCount)
      })
    })

    describe('when fetch resolves with a retryable status code 2x, and then a 200', () => {
      const callCount = 3

    ;[408, 429, 502, 503, 504].forEach((status) => {
        it(`makes a total of ${callCount} requests after HTTP ${status} and eventually resolves`, async () => {
          let count = 0

          const inc = () => count++

          mockUpload().reply(status, inc)
          mockUpload().reply(status, inc)
          mockUpload().reply(200, inc)

          const uploadPromise = uploadStream(fsReadStream, destinationUrl, fileSize, noopRetry)

          execSimpleStream()
          await expect(uploadPromise).to.be.fulfilled
          expect(count).to.eq(callCount)
        })
      })
    })
  })

  describe('when passed a timeout controller', () => {
    let activityMonitor: StreamActivityMonitor
    const maxStartDwellTime = 1000
    const maxActivityDwellTime = 1000
    let abortController: AbortController

    beforeEach(() => {
      abortController = new AbortController()
      activityMonitor = new StreamActivityMonitor(maxStartDwellTime, maxActivityDwellTime)
      sinon.stub(activityMonitor, 'getController').callsFake(() => abortController)
      sinon.stub(activityMonitor, 'monitor').callsFake((arg) => arg)
    })

    it('pipes the readstream through the timeout controller monitoring method', async () => {
      mockUpload().reply(200)
      const uploadPromise = uploadStream(fsReadStream, destinationUrl, fileSize, noopRetry, activityMonitor)

      execSimpleStream()
      await expect(uploadPromise).to.be.fulfilled
      expect(activityMonitor.monitor).to.be.calledWith(fileReadableStream)
    })

    describe('and the timeout monitor\'s signal aborts with a StreamStartTimedOut error', () => {
      beforeEach(() => {
        abortController.abort(new StreamStartTimedOutError(maxStartDwellTime))
      })

      it('rejects with a StreamStartFailed error', async () => {
        const uploadPromise = uploadStream(fsReadStream, destinationUrl, fileSize, noopRetry, activityMonitor)

        await expect(uploadPromise).to.be.rejectedWith(StreamStartTimedOutError)
      })
    })

    describe('and the timeout monitor\'s signal aborts with a StreamStalled error', () => {
      beforeEach(() => {
        abortController.abort(new StreamStalledError(maxActivityDwellTime))
      })

      it('rejects with a StreamStalled error', async () => {
        const uploadPromise = uploadStream(fsReadStream, destinationUrl, fileSize, noopRetry, activityMonitor)

        await expect(uploadPromise).to.be.rejectedWith(StreamStalledError)
      })
    })
  })
})
