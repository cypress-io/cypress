//import { uploadStream } from '../../../lib/cloud/uploadStream'
//import { ReadStream } from 'fs'
//import { PassThrough } from 'stream'
import nock from 'nock'

describe('uploadStream', () => {
  let destinationUrl
  //let fileStream: ReadStream
  let scope: nock.Scope

  beforeEach(() => {
    //fileStream = new ReadStream()
    destinationUrl = 'http://somedomain.test'

    scope = nock(destinationUrl)
  })
  /*
  describe('when file stream emits an error', () => {

  })

  describe('when fetch rejects with a connection error', () => {

  })

  describe('when fetch resolves with an HTTP error', () => {

  })

  describe('when upload does not begin within timeout window', () => {

  })

  describe('when upload stalls', () => {

  })
*/

  describe('when fetch resolves with a 200 OK', () => {
    beforeEach(() => {
      scope.put('/').reply(200, 'OK')
    })
  })
})
