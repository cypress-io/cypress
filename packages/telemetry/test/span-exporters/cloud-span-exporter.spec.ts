import { describe, it, expect } from 'vitest'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '../../src/span-exporters/cloud-span-exporter'

const genericRequest = { encryption: { encryptRequest: ({ url, method, body }: {url: string, method: string, body: string}) => Promise.resolve({ jwe: 'req' }) } }

describe('cloudSpanExporter', () => {
  describe('new', () => {
    it('sets encrypted header if set', () => {
      const exporter = new OTLPTraceExporter(genericRequest)

      expect(exporter.headers['x-cypress-encrypted']).toEqual('1')
      expect(exporter.requirementsToExport).toEqual('unknown')
      expect(exporter.enc).toBeDefined()
    })

    it('does not set encrypted header if not set', () => {
      const exporter = new OTLPTraceExporter()

      expect(exporter.headers['x-cypress-encrypted']).toBeUndefined()
      expect(exporter.requirementsToExport).toEqual('met')
      expect(exporter.enc).toBeUndefined()
    })
  })

  describe('attachProjectId', () => {
    it('sets the project id header', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.setAuthorizationHeader = () => {
        callCount++
      }

      expect(exporter.headers['x-project-id']).toBeUndefined()
      expect(exporter.projectId).toBeUndefined()

      exporter.attachProjectId('123')

      expect(exporter.headers['x-project-id']).toEqual('123')
      expect(exporter.projectId).toEqual('123')
      expect(callCount).toEqual(1)
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

      expect(exporter.headers['x-project-id']).toBeUndefined()
      expect(exporter.projectId).toBeUndefined()

      exporter.attachProjectId(undefined)

      expect(exporter.headers['x-project-id']).toBeUndefined()
      expect(exporter.projectId).toBeUndefined()
      expect(callCount).toEqual(0)

      expect(exporter.requirementsToExport).toEqual('unmet')
      expect(abortCallCount).toEqual(1)
    })
  })

  describe('attachRecordKey', () => {
    it('sets the record key header', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.setAuthorizationHeader = () => {
        callCount++
      }

      expect(exporter.recordKey).toBeUndefined()

      exporter.attachRecordKey('123')

      expect(exporter.recordKey).toEqual('123')
      expect(callCount).toEqual(1)
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

      expect(exporter.recordKey).toBeUndefined()

      exporter.attachRecordKey(undefined)

      expect(exporter.recordKey).toBeUndefined()
      expect(callCount).toEqual(0)

      expect(exporter.requirementsToExport).toEqual('unmet')
      expect(abortCallCount).toEqual(1)
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
      expect(authorization).toEqual(`Basic MTIzOjQ1Ng==`)
      expect(exporter.requirementsToExport).toEqual('met')
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

      expect(callCount).toEqual(0)
      expect(exporter.delayedItemsToExport.length).toEqual(1)
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

      expect(callCount).toEqual(0)
      expect(exporter.delayedItemsToExport.length).toEqual(1)
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

      expect(callCount).toEqual(0)
      expect(exporter.delayedItemsToExport.length).toEqual(1)
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

      expect(callCount).toEqual(1)
      expect(exporter.delayedItemsToExport.length).toEqual(0)
    })
  })

  describe('abortDelayedItems', () => {
    it('aborts any delayed items', () => {
      const exporter = new OTLPTraceExporter()

      return new Promise((resolvePromise) => {
        exporter.delayedItemsToExport.push({
          serviceRequest: 'req',
          onSuccess: () => {},
          onError: (error) => {
            expect(error.message).toEqual('Spans cannot be sent, exporter has unmet requirements, either project id or record key are undefined.')
            resolvePromise()
          },
        })

        exporter.abortDelayedItems()
        expect(exporter.delayedItemsToExport.length).toEqual(0)
      })
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

      expect(exporter.send([{ name: 'string' }] as ReadableSpan[], onSuccess, onError)).toBeUndefined()
    })

    it('sends a string', () => {
      return new Promise((resolvePromise, rejectPromise) => {
        const exporter = new OTLPTraceExporter()

        exporter.convert = (objects) => {
          throw 'convert should not be called'
        }

        exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
          expect(collector).to.not.be.undefined
          expect(body).toEqual('string')
          expect(contentType).toEqual('application/json')
          expect(resolve).to.not.be.undefined
          expect(reject).to.not.be.undefined
          resolve()
        }

        const onSuccess = () => {
          resolvePromise()
        }

        const onError = () => {
          rejectPromise('onError should not be called')
        }

        exporter.send('string', onSuccess, onError)
      })
    })

    it('sends an array of readable spans', () => {
      const exporter = new OTLPTraceExporter()

      return new Promise((resolvePromise, rejectPromise) => {
        // @ts-expect-error
        exporter.convert = (objects) => {
          expect(objects[0].name).toEqual('string')

          return 'string'
        }

        exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
          expect(collector).to.not.be.undefined
          expect(body).toEqual(JSON.stringify('string'))
          expect(contentType).toEqual('application/json')
          expect(resolve).to.not.be.undefined
          expect(reject).to.not.be.undefined
          resolve()
        }

        const onSuccess = () => {
          resolvePromise()
        }

        const onError = () => {
          rejectPromise('onError should not be called')
        }

        exporter.send([{ name: 'string' }] as ReadableSpan[], onSuccess, onError)
      })
    })

    it('fails to send the request', () => {
      const exporter = new OTLPTraceExporter()

      return new Promise((resolvePromise, rejectPromise) => {
        // @ts-expect-error
        exporter.convert = (objects) => {
          expect(objects[0].name).toEqual('string')

          return 'string'
        }

        exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
          expect(collector).to.not.be.undefined
          expect(body).toEqual(JSON.stringify('string'))
          expect(contentType).toEqual('application/json')
          expect(resolve).toBeDefined()
          expect(reject).toBeDefined()
          // @ts-expect-error
          reject('err')
        }

        const onSuccess = () => {
          rejectPromise('onSuccess should not be called')
        }

        const onError = (err) => {
          expect(err).toEqual('err')
          resolvePromise()
        }

        exporter.send([{ name: 'string' }] as ReadableSpan[], onSuccess, onError)
      })
    })

    it('encrypts the request', () => {
      const encryption = {
        encryptRequest: ({ url, method, body }) => {
          expect(body).toEqual('string')

          return Promise.resolve({ jwe: 'encrypted' })
        },
      }

      const exporter = new OTLPTraceExporter({
        encryption,
        headers: {
          Authorization: `Basic ${Buffer.from((`${123}:${456}`)).toString('base64')}`,
        },
      })

      return new Promise((resolvePromise, rejectPromise) => {
        exporter.convert = (objects) => {
          throw 'convert should not be called'
        }

        exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
          expect(collector).toBeDefined()
          expect(body).toEqual(JSON.stringify('encrypted'))
          expect(contentType).toEqual('application/json')
          expect(resolve).toBeDefined()
          expect(reject).toBeDefined()
          resolve()
        }

        const onSuccess = () => {
          resolvePromise()
        }

        const onError = () => {
          rejectPromise('onError should not be called')
        }

        exporter.send('string', onSuccess, onError)
      })
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

      expect(exporter.delayedItemsToExport.length).toEqual(0)

      exporter.send('string', onSuccess, onError)

      expect(exporter.delayedItemsToExport.length).toEqual(1)
      expect(exporter.delayedItemsToExport[0].serviceRequest).toEqual('string')
    })

    it('errors if requirements are unmet', () => {
      const exporter = new OTLPTraceExporter()

      return new Promise((resolvePromise, rejectPromise) => {
        exporter.requirementsToExport = 'unmet'

        exporter.convert = (objects) => {
          throw 'convert should not be called'
        }

        exporter.sendWithHttp = (collector, body, contentType, resolve, reject) => {
          throw 'sendWithHttp should not be called'
        }

        const onSuccess = () => {
          rejectPromise('onSuccess should not be called')
        }

        const onError = (error) => {
          expect(error.message).toEqual('Spans cannot be sent, exporter has unmet requirements, either project id or record key are undefined.')
          resolvePromise()
        }

        exporter.send('string', onSuccess, onError)
      })
    })
  })
})
