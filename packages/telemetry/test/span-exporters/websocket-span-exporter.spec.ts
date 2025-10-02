import { describe, it, expect } from 'vitest'
import { OTLPTraceExporter } from '../../src/span-exporters/websocket-span-exporter'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base'

describe('ipcSpanExporter', () => {
  describe('new', () => {
    it('new sets delayedExport to an empty array', () => {
      const exporter = new OTLPTraceExporter()

      expect(exporter.delayedExport.length).toEqual(0)
    })
  })

  describe('attachWebSocket', () => {
    it('attaches the supplied ipc', () => {
      const exporter = new OTLPTraceExporter()

      exporter.delayedExport.push({ items: [{ name: 'span' }] as ReadableSpan[], resultCallback: () => {} })

      exporter.export = (items, resultCallback) => {
        expect(items[0].name).toEqual('span')
      }

      exporter.attachWebSocket({ name: 'socket', emit: () => {} })

      expect(exporter.ws.name).toEqual('socket')
    })
  })

  describe('export', () => {
    it('delays export if ws is not present', () => {
      const exporter = new OTLPTraceExporter()

      exporter.send = () => {
        throw 'send should not be called'
      }

      expect(exporter.delayedExport.length).toEqual(0)

      exporter.export([{ name: 'span' }] as ReadableSpan[], (result) => {})

      expect(exporter.delayedExport.length).toEqual(1)
      expect(exporter.delayedExport[0].items[0].name).toEqual('span')
    })

    it('does not delay if ws is present', () => {
      const exporter = new OTLPTraceExporter()

      exporter.ws = { name: 'ws', emit: () => {} }

      exporter.send = (objects, onSuccess, onError) => {
        expect(objects[0].name).toEqual('span')
        expect(onSuccess).toBeDefined()
        expect(onError).toBeDefined()
      }

      expect(exporter.delayedExport.length).toEqual(0)

      exporter.export([{ name: 'span' }] as ReadableSpan[], (result) => {})

      expect(exporter.delayedExport.length).toEqual(0)
    })
  })

  describe('send', () => {
    it('returns if shutdownOnce.isCalled is true', () => {
      const exporter = new OTLPTraceExporter()

      exporter.convert = (objects) => {
        throw 'convert should not be called'
      }

      exporter.ws = {
        emit: (event, subEvent, request, callback) => {
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

      expect(exporter.send([{ name: 'string' }] as ReadableSpan[], onSuccess, onError)).toBeUndefined()
    })

    it('sends via websocket', () => {
      const exporter = new OTLPTraceExporter()

      return new Promise((resolvePromise, rejectPromise) => {
        // @ts-expect-error
        exporter.convert = (objects) => {
          expect(objects[0].name).toEqual('span')

          return 'span'
        }

        exporter.ws = {
          emit: (event, subEvent, request, callback) => {
            expect(event).toEqual('backend:request')
            expect(subEvent).toEqual('telemetry')
            expect(request).toEqual(JSON.stringify('span'))
            expect(callback).toBeDefined()
            callback({})
          },
        }

        const onSuccess = () => {
          resolvePromise()
        }

        const onError = () => {
          rejectPromise('onError should not be called')
        }

        exporter.send([{ name: 'span' }] as ReadableSpan[], onSuccess, onError)
      })
    })

    it('handles an exception in the ipc send command', () => {
      const exporter = new OTLPTraceExporter()

      return new Promise((resolvePromise) => {
        // @ts-expect-error
        exporter.convert = (objects) => {
          expect(objects[0].name).toEqual('span')

          return 'span'
        }

        exporter.ws = {
          emit: (event, subEvent, request, callback) => {
            expect(event).toEqual('backend:request')
            expect(subEvent).toEqual('telemetry')
            expect(request).toEqual(JSON.stringify('span'))
            expect(callback).toBeDefined()
            callback({
              res: {
                error: 'this broke',
              },
            })
          },
        }

        const onSuccess = () => {
          resolvePromise()
        }

        const onError = (err) => {
          expect(err).toEqual('this broke')
          resolvePromise()
        }

        exporter.send([{ name: 'span' }] as ReadableSpan[], onSuccess, onError)
      })
    })
  })
})
