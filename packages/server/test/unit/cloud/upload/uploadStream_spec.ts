import fs, { ReadStream } from 'fs'
import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { uploadStream, HttpError } from '../../../../lib/cloud/upload/uploadStream'
import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import { StreamActivityMonitor, StreamStalled, StreamStartFailed } from '../../../../lib/cloud/upload/StreamActivityMonitor'

chai.use(chaiAsPromised).use(sinonChai)

import nock from 'nock'

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

  function execSimpleStream () {
    fileStreamController.enqueue(fileContents)
    fileStreamController.close()
  }

  function mockUpload () {
    return scope.put(destinationPath, undefined, {
      reqheaders: {
        'content-length': fileSize.toString(),
      },
    })
  }

  beforeEach(() => {
    fileContents = 'lorem ipsum dolor set'
    fileSize = fileContents.length
    filePath = '/some/file/path'

    fileReadableStream = new ReadableStream({
      start (controller) {
        fileStreamController = controller
      },
    })

    sinon.stub(fs, 'createReadStream').callsFake((path) => {
      expect(path).to.equal(filePath)

      return sinon.createStubInstance(ReadStream)
    })

    sinon.stub(Readable, 'toWeb').callsFake((readStream: Readable) => {
      expect(readStream).to.be.an.instanceOf(ReadStream)

      return fileReadableStream
    })

    fileSize = 1000 // 1 kb

    destinationDomain = 'http://somedomain.test:80'
    destinationPath = '/upload'
    destinationUrl = `${destinationDomain}${destinationPath}`
    scope = nock(destinationDomain)
  })

  afterEach(() => {
    (fs.createReadStream as sinon.SinonStub).restore()

    ;(Readable.toWeb as sinon.SinonStub).restore()
  })

  describe('when fetch resolves with a 200 OK', () => {
    beforeEach(() => {
      mockUpload().reply(200, 'OK')
    })

    it(`resolves`, async () => {
      uploadPromise = uploadStream(filePath, fileSize, destinationUrl)
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
      const uploadPromise = uploadStream(filePath, fileSize, destinationUrl)

      execSimpleStream()

      await expect(uploadPromise).to.eventually.be.rejectedWith(HttpError, '403: Forbidden')
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
      const uploadPromise = uploadStream(filePath, fileSize, destinationUrl, activityMonitor)

      expect(activityMonitor.monitor).to.be.calledWith(fileReadableStream)
      execSimpleStream()
      await expect(uploadPromise).to.be.fulfilled
    })

    describe('and the timeout monitor\'s signal aborts with a StreamStartTimedOut error', () => {
      beforeEach(() => {
        abortController.abort(new StreamStartFailed(maxStartDwellTime))
      })

      it('rejects with a StreamStartFailed error', async () => {
        const uploadPromise = uploadStream(filePath, fileSize, destinationUrl, activityMonitor)

        await expect(uploadPromise).to.be.rejectedWith(StreamStartFailed)
      })
    })

    describe('and the timeout monitor\'s signal aborts with a StreamStalled error', () => {
      beforeEach(() => {
        abortController.abort(new StreamStalled(maxActivityDwellTime))
      })

      it('rejects with a StreamStalled error', async () => {
        const uploadPromise = uploadStream(filePath, fileSize, destinationUrl, activityMonitor)

        await expect(uploadPromise).to.be.rejectedWith(StreamStalled)
      })
    })
  })
})
