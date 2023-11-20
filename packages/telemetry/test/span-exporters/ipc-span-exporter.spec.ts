import { expect } from 'chai'

import { OTLPTraceExporter } from '../../src/span-exporters/ipc-span-exporter'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base'

describe('ipcSpanExporter', () => {
  describe('new', () => {
    it('new sets delayedExport to an empty array', () => {
      const exporter = new OTLPTraceExporter()

      expect(exporter.delayedExport.length).to.equal(0)
    })
  })

  describe('attachIPC', () => {
    it('attaches the supplied ipc', () => {
      const exporter = new OTLPTraceExporter()

      exporter.delayedExport.push({ items: [{ name: 'span' }] as ReadableSpan[], resultCallback: () => {} })

      exporter.export = (items, resultCallback) => {
        expect(items[0].name).to.equal('span')
      }

      exporter.attachIPC({ name: 'ipc', send: () => {} })

      expect(exporter.ipc.name).to.equal('ipc')
    })
  })

  describe('export', () => {
    it('delays export if ipc is not present', () => {
      const exporter = new OTLPTraceExporter()

      exporter.send = () => {
        throw 'send should not be called'
      }

      expect(exporter.delayedExport.length).to.equal(0)

      exporter.export([{ name: 'span' }] as ReadableSpan[], (result) => {})

      expect(exporter.delayedExport.length).to.equal(1)
      expect(exporter.delayedExport[0].items[0].name).to.equal('span')
    })

    it('does not delay if ipc is present', () => {
      const exporter = new OTLPTraceExporter()

      exporter.ipc = { name: 'ipc', send: () => {} }

      exporter.send = (objects, onSuccess, onError) => {
        expect(objects[0].name).to.equal('span')
        expect(onSuccess).to.not.be.undefined
        expect(onError).to.not.be.undefined
      }

      expect(exporter.delayedExport.length).to.equal(0)

      exporter.export([{ name: 'span' }] as ReadableSpan[], (result) => {})

      expect(exporter.delayedExport.length).to.equal(0)
    })
  })

  describe('send', () => {
    it('returns if shutdownOnce.isCalled is true', () => {
      const exporter = new OTLPTraceExporter()

      exporter.convert = (objects) => {
        throw 'convert should not be called'
      }

      exporter.ipc = {
        send: (event, request) => {
          throw 'sendWithHTTP should not be called'
        },
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

    it('sends via ipc', (done) => {
      const exporter = new OTLPTraceExporter()

      // @ts-expect-error
      exporter.convert = (objects) => {
        expect(objects[0].name).to.equal('span')

        return 'span'
      }

      exporter.ipc = {
        send: (event, request) => {
          expect(event).to.equal('export:telemetry')
          expect(request).to.equal(JSON.stringify('span'))
        },
      }

      const onSuccess = () => {
        done()
      }

      const onError = () => {
        throw 'onError should not be called'
      }

      exporter.send([{ name: 'span' }] as ReadableSpan[], onSuccess, onError)
    })

    it('handles an exception in the ipc send command', (done) => {
      const exporter = new OTLPTraceExporter()

      // @ts-expect-error
      exporter.convert = (objects) => {
        expect(objects[0].name).to.equal('span')

        return 'span'
      }

      exporter.ipc = {
        send: (event, request) => {
          throw 'ipc error'
        },
      }

      const onSuccess = () => {
        done()
      }

      const onError = (err) => {
        expect(err).to.equal('ipc error')
        done()
      }

      exporter.send([{ name: 'span' }] as ReadableSpan[], onSuccess, onError)
    })
  })
})
