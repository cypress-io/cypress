import { expect } from 'chai'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base'

import { OTLPTraceExporter } from '../../src/span-exporters/cloud-span-exporter'

const genericRequest = { encryption: { encryptRequest: ({ url, method, body }: {url: string, method: string, body: string}) => Promise.resolve({ jwe: 'req' }) } }

describe('cloudSpanExporter', () => {
  describe('new', () => {
    it('sets encrypted header if set', () => {
      const exporter = new OTLPTraceExporter(genericRequest)

      expect(exporter.headers['x-cypress-encrypted']).to.equal('1')
      expect(exporter.requirementsToExport).to.equal('unknown')
      expect(exporter.enc).to.not.be.undefined
    })

    it('does not set encrypted header if not set', () => {
      const exporter = new OTLPTraceExporter()

      expect(exporter.headers['x-cypress-encrypted']).to.be.undefined
      expect(exporter.requirementsToExport).to.equal('met')
      expect(exporter.enc).to.be.undefined
    })
  })

  describe('attachProjectId', () => {
    it('sets the project id header', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.setAuthorizationHeader = () => {
        callCount++
      }

      expect(exporter.headers['x-project-id']).to.be.undefined
      expect(exporter.projectId).to.be.undefined

      exporter.attachProjectId('123')

      expect(exporter.headers['x-project-id']).to.equal('123')
      expect(exporter.projectId).to.equal('123')
      expect(callCount).to.equal(1)
    })

    it('sets requirements to unmet if id is not passed', () => {
      const exporter = new OTLPTraceExporter(genericRequest)

      let callCount = 0
      let abortCallCount = 0

      exporter.setAuthorizationHeader = () => {
        callCount++
      }

      exporter.abortDelayedItems = () => {
        abortCallCount++
      }

      expect(exporter.headers['x-project-id']).to.be.undefined
      expect(exporter.projectId).to.be.undefined

      exporter.attachProjectId(undefined)

      expect(exporter.headers['x-project-id']).to.be.undefined
      expect(exporter.projectId).to.be.undefined
      expect(callCount).to.equal(0)

      expect(exporter.requirementsToExport).to.equal('unmet')
      expect(abortCallCount).to.equal(1)
    })
  })

  describe('attachRecordKey', () => {
    it('sets the record key header', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.setAuthorizationHeader = () => {
        callCount++
      }

      expect(exporter.recordKey).to.be.undefined

      exporter.attachRecordKey('123')

      expect(exporter.recordKey).to.equal('123')
      expect(callCount).to.equal(1)
    })

    it('sets requirements to unmet  if record key is not passed', () => {
      const exporter = new OTLPTraceExporter(genericRequest)

      let callCount = 0
      let abortCallCount = 0

      exporter.setAuthorizationHeader = () => {
        callCount++
      }

      exporter.abortDelayedItems = () => {
        abortCallCount++
      }

      expect(exporter.recordKey).to.be.undefined

      exporter.attachRecordKey(undefined)

      expect(exporter.recordKey).to.be.undefined
      expect(callCount).to.equal(0)

      expect(exporter.requirementsToExport).to.equal('unmet')
      expect(abortCallCount).to.equal(1)
    })
  })

  describe('setAuthorizationHeader', () => {
    it('sets the header if projectId and recordKey are present', () => {
      const exporter = new OTLPTraceExporter()

      exporter.projectId = '123'
      exporter.recordKey = '456'

      exporter.setAuthorizationHeader()

      const authorization = exporter.headers.Authorization

      // MTIzOjQ1Ng== is 123:456 base64 encoded
      expect(authorization).to.equal(`Basic MTIzOjQ1Ng==`)
      expect(exporter.requirementsToExport).to.equal('met')
    })
  })

  describe('sendDelayedItems', () => {
    it('does not send if both project id and record key are not set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.sendDelayedItems()

      expect(callCount).to.equal(0)
      expect(exporter.delayedItemsToExport.length).to.equal(1)
    })

    it('does not send if project id is not set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.attachRecordKey('123')
      exporter.sendDelayedItems()

      expect(callCount).to.equal(0)
      expect(exporter.delayedItemsToExport.length).to.equal(1)
    })

    it('does not send if record key is not set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.attachProjectId('123')
      exporter.sendDelayedItems()

      expect(callCount).to.equal(0)
      expect(exporter.delayedItemsToExport.length).to.equal(1)
    })

    it('does send if record key and project id are set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.attachProjectId('123')
      exporter.attachRecordKey('123')
      exporter.sendDelayedItems()

      expect(callCount).to.equal(1)
      expect(exporter.delayedItemsToExport.length).to.equal(0)
    })
  })

  describe('abortDelayedItems', () => {
    it('aborts any delayed items', (done) => {
      const exporter = new OTLPTraceExporter()

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: (error) => {
          expect(error.message).to.equal('Spans cannot be sent, exporter has unmet requirements, either project id or record key are undefined.')
          done()
        },
      })

      exporter.abortDelayedItems()
      expect(exporter.delayedItemsToExport.length).to.equal(0)
    })
  })

  describe('send', () => {
    it('returns if shutdownOnce.isCalled is true', () => {
      const exporter = new OTLPTraceExporter()

      exporter.convert = (objects) => {
        throw 'convert should not be called'
      }

      exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
        throw 'sendWithHTTP should not be called'
      }

      const onSuccess = () => {
        throw 'onSuccess should not be called'
      }

      const onError = () => {
        throw 'onError should not be called'
      }

      // @ts-expect-error
      exporter._shutdownOnce = { isCalled: true }

      expect(exporter.send([{ name: 'string' }] as ReadableSpan[], onSuccess, onError)).to.be.undefined
    })

    it('sends a string', (done) => {
      const exporter = new OTLPTraceExporter()

      exporter.convert = (objects) => {
        throw 'convert should not be called'
      }

      exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
        expect(collector).to.not.be.undefined
        expect(body).to.equal('string')
        expect(contentType).to.equal('application/json')
        expect(resolve).to.not.be.undefined
        expect(reject).to.not.be.undefined
        resolve()
      }

      const onSuccess = () => {
        done()
      }

      const onError = () => {
        throw 'onError should not be called'
      }

      exporter.send('string', onSuccess, onError)
    })

    it('sends an array of readable spans', (done) => {
      const exporter = new OTLPTraceExporter()

      // @ts-expect-error
      exporter.convert = (objects) => {
        expect(objects[0].name).to.equal('string')

        return 'string'
      }

      exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
        expect(collector).to.not.be.undefined
        expect(body).to.equal(JSON.stringify('string'))
        expect(contentType).to.equal('application/json')
        expect(resolve).to.not.be.undefined
        expect(reject).to.not.be.undefined
        resolve()
      }

      const onSuccess = () => {
        done()
      }

      const onError = () => {
        throw 'onError should not be called'
      }

      exporter.send([{ name: 'string' }] as ReadableSpan[], onSuccess, onError)
    })

    it('fails to send the request', (done) => {
      const exporter = new OTLPTraceExporter()

      // @ts-expect-error
      exporter.convert = (objects) => {
        expect(objects[0].name).to.equal('string')

        return 'string'
      }

      exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
        expect(collector).to.not.be.undefined
        expect(body).to.equal(JSON.stringify('string'))
        expect(contentType).to.equal('application/json')
        expect(resolve).to.not.be.undefined
        expect(reject).to.not.be.undefined
        // @ts-expect-error;'
        reject('err')
      }

      const onSuccess = () => {
        throw 'onSuccess should not be called'
      }

      const onError = (err) => {
        expect(err).to.equal('err')
        done()
      }

      exporter.send([{ name: 'string' }] as ReadableSpan[], onSuccess, onError)
    })

    it('encrypts the request', (done) => {
      const encryption = {
        encryptRequest: ({ url, method, body }) => {
          expect(body).to.equal('string')

          return Promise.resolve({ jwe: 'encrypted' })
        },
      }

      const exporter = new OTLPTraceExporter({
        encryption,
        headers: {
          Authorization: `Basic ${Buffer.from((`${123}:${456}`)).toString('base64')}`,
        },
      })

      exporter.convert = (objects) => {
        throw 'convert should not be called'
      }

      exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
        expect(collector).to.not.be.undefined
        expect(body).to.equal(JSON.stringify('encrypted'))
        expect(contentType).to.equal('application/json')
        expect(resolve).to.not.be.undefined
        expect(reject).to.not.be.undefined
        resolve()
      }

      const onSuccess = () => {
        done()
      }

      const onError = () => {
        throw 'onError should not be called'
      }

      exporter.send('string', onSuccess, onError)
    })

    it('delays the request if encryption is enabled authorization is not present', () => {
      const encryption = {
        encryptRequest: ({ url, method, body }) => {
          throw 'encryptRequest should not be called'
        },
      }

      const exporter = new OTLPTraceExporter({
        encryption,
      })

      exporter.convert = (objects) => {
        throw 'convert should not be called'
      }

      exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
        throw 'sendWithHttp should not be called'
      }

      const onSuccess = () => {
        throw 'onSuccess should not be called'
      }

      const onError = () => {
        throw 'onError should not be called'
      }

      expect(exporter.delayedItemsToExport.length).to.equal(0)

      exporter.send('string', onSuccess, onError)

      expect(exporter.delayedItemsToExport.length).to.equal(1)
      expect(exporter.delayedItemsToExport[0].serviceRequest).to.equal('string')
    })

    it('errors if requirements are unmet', (done) => {
      const exporter = new OTLPTraceExporter()

      exporter.requirementsToExport = 'unmet'

      exporter.convert = (objects) => {
        throw 'convert should not be called'
      }

      exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
        throw 'sendWithHttp should not be called'
      }

      const onSuccess = () => {
        throw 'onSuccess should not be called'
      }

      const onError = (error) => {
        expect(error.message).to.equal('Spans cannot be sent, exporter has unmet requirements, either project id or record key are undefined.')
        done()
      }

      exporter.send('string', onSuccess, onError)
    })
  })
})
