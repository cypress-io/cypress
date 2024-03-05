import chai, { expect } from 'chai'

import chaiAsPromised from 'chai-as-promised'
import { uploadStream, HttpError } from '../../../lib/cloud/uploadStream'

import { PassThrough } from 'stream'

chai.use(chaiAsPromised)

import nock from 'nock'

describe('uploadStream', () => {
  let destinationUrl: string
  let destinationPath: string
  let destinationDomain: string
  let fileStream: PassThrough
  let uploadPromise: Promise<any>
  let scope: nock.Scope

  function completeStream () {
    fileStream.emit('readable')
    fileStream.emit('data', 'data')
    fileStream.emit('end')
    fileStream.emit('finish')
    fileStream.emit('close')
  }

  beforeEach(() => {
    fileStream = new PassThrough()
    destinationDomain = 'http://somedomain.test:80'
    destinationPath = '/upload'
    destinationUrl = `${destinationDomain}${destinationPath}`
    scope = nock(destinationDomain)
  })

  describe('when fetch resolves with a 200 OK', () => {
    beforeEach(() => {
      scope.put(destinationPath).reply(200, 'OK')
    })

    it(`resolves with 'OK'`, async () => {
      uploadPromise = uploadStream<string>(fileStream, destinationUrl)
      completeStream()
      await uploadPromise
      expect(uploadPromise).to.eventually.equal('OK')
    })
  })

  describe('when fetch resolves with a 200 JSON response', () => {
    let response: {
      message: string
    }

    beforeEach(() => {
      response = { message: 'ok' }

      scope.put(destinationPath).reply(200, JSON.stringify(response), {
        'Content-type': 'application/json',
      })
    })

    it('resolves with the json decoded response', async () => {
      uploadPromise = uploadStream(fileStream, destinationUrl)
      completeStream()
      await uploadPromise
      expect(uploadPromise).to.eventually.deep.equal(response)
    })
  })

  describe('when fetch resolves with a 404 response', () => {
    beforeEach(() => {
      scope.put(destinationPath).reply(404)
    })

    it('resolves with undefined', async () => {
      uploadPromise = uploadStream(fileStream, destinationUrl)
      completeStream()
      await uploadPromise
      expect(uploadPromise).to.eventually.be.undefined
    })
  })

  describe('when fetch resolves with a non-404 4xx/5xx response', () => {
    const status = 403

    beforeEach(() => {
      scope.put(destinationPath).reply(status)
    })

    it('rejects with an appropriate HttpError', async () => {
      let caught = false

      try {
        const p = uploadStream(fileStream, destinationUrl)

        completeStream()
        await p
      } catch (e) {
        caught = true
        expect(e instanceof HttpError).to.be.true
        expect((e as HttpError).status).to.eq(status)
      }
      expect(caught).to.be.true
    })
  })
})
