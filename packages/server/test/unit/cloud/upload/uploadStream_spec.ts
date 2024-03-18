import fs, { ReadStream } from 'fs'
import fsPromises from 'fs/promises'
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
  let fileStreamController: ReadableStreamDefaultController
  let fileContents: string
  let filePath: string
  let fileReadableStream: ReadableStream
  let invalidPath: string
  let maxSize: number

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
    maxSize = fileSize + 1
    filePath = '/some/file/path'
    invalidPath = '/some/invalid/path'

    fileReadableStream = new ReadableStream({
      start (controller) {
        fileStreamController = controller
      },
    })

    sinon.stub(fs, 'createReadStream').callsFake((path) => {
      expect(path).to.equal(filePath)

      return sinon.createStubInstance(ReadStream)
    })

    const statStub = sinon.stub(fsPromises, 'stat')

    statStub.withArgs(filePath)
    // this resolves with a partial Stat
    // @ts-ignore
    .callsFake((path) => {
      return Promise.resolve({
        size: fileSize,
      })
    })

    statStub.withArgs(invalidPath)
    .callsFake((path) => {
      const e = new Error(`ENOENT: no such file or directory, stat ${path}`)

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

    sinon.stub(Readable, 'toWeb').callsFake((readStream: Readable) => {
      expect(readStream).to.be.an.instanceOf(ReadStream)

      return fileReadableStream
    })

    destinationDomain = 'http://somedomain.test:80'
    destinationPath = '/upload'
    destinationUrl = `${destinationDomain}${destinationPath}`
    scope = nock(destinationDomain)
  })

  afterEach(() => {
    nock.cleanAll()

    ;(fs.createReadStream as sinon.SinonStub).restore()

    ;(Readable.toWeb as sinon.SinonStub).restore()

    ;(fsPromises.stat as sinon.SinonStub).restore()
  })

  it('re-throws system errors when encountered from fs.stat', () => {
    return expect(
      uploadStream(invalidPath, destinationUrl, maxSize, noopRetry),
    ).to.be.rejectedWith('ENOENT: no such file or directory, stat /some/invalid/path')
  })

  it('throws an error when file contents are larger than the specified max size', () => {
    return expect(
      uploadStream(filePath, destinationUrl, fileContents.length - 1, noopRetry),
    ).to.be.rejectedWith(`Spec recording too large: db is ${fileContents.length} bytes, limit is ${fileContents.length - 1} bytes`)
  })

  describe('when fetch resolves with a 200 OK', () => {
    beforeEach(() => {
      mockUpload().reply(200, 'OK')
    })

    it(`resolves`, async () => {
      uploadPromise = uploadStream(filePath, destinationUrl, maxSize, noopRetry)
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
      const uploadPromise = uploadStream(filePath, destinationUrl, maxSize, noopRetry)

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

        const uploadPromise = uploadStream(filePath, destinationUrl, maxSize, noopRetry)

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

          const uploadPromise = uploadStream(filePath, destinationUrl, maxSize, noopRetry)

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
      const uploadPromise = uploadStream(filePath, destinationUrl, maxSize, noopRetry, activityMonitor)

      execSimpleStream()
      await expect(uploadPromise).to.be.fulfilled
      expect(activityMonitor.monitor).to.be.calledWith(fileReadableStream)
    })

    describe('and the timeout monitor\'s signal aborts with a StreamStartTimedOut error', () => {
      beforeEach(() => {
        abortController.abort(new StreamStartTimedOutError(maxStartDwellTime))
      })

      it('rejects with a StreamStartFailed error', async () => {
        const uploadPromise = uploadStream(filePath, destinationUrl, maxSize, noopRetry, activityMonitor)

        await expect(uploadPromise).to.be.rejectedWith(StreamStartTimedOutError)
      })
    })

    describe('and the timeout monitor\'s signal aborts with a StreamStalled error', () => {
      beforeEach(() => {
        abortController.abort(new StreamStalledError(maxActivityDwellTime))
      })

      it('rejects with a StreamStalled error', async () => {
        const uploadPromise = uploadStream(filePath, destinationUrl, maxSize, noopRetry, activityMonitor)

        await expect(uploadPromise).to.be.rejectedWith(StreamStalledError)
      })
    })
  })
})
