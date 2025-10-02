import { describe, it, expect } from 'vitest'
import { ConsoleTraceLinkExporter } from '../../src/span-exporters/console-trace-link-exporter'

describe('consoleTraceLinkExporter', () => {
  describe('new', () => {
    it('sets up trace url', () => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      // @ts-expect-error
      expect(exporter._traceUrl).toEqual('https://ui.honeycomb.io/team/environments/environment/datasets/serviceName/trace?trace_id')
    })
  })

  describe('export', () => {
    it('logs the start of the first span with a unique trace', () => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      // @ts-expect-error
      exporter._log = (...args) => {
        expect(args[0]).toEqual('Trace start: [spanName] - https://ui.honeycomb.io/team/environments/environment/datasets/serviceName/trace?trace_id=traceId')
      }

      return new Promise((resolve) => {
        exporter.export([{
          name: 'spanName',
          // @ts-expect-error
          spanContext: () => {
            return {
              traceId: 'traceId',
              spanId: 'spanId',
            }
          },
        }], (result) => {
          // @ts-expect-error
          expect(exporter._uniqueTraces['traceId']).toEqual('spanId')
          expect(result.code).toEqual(0)
          resolve()
        })
      })
    })

    it('ignores the start of the second span with a unique trace', () => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      exporter.export([{
        name: 'spanName',
        // @ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], () => {})

      // @ts-expect-error
      exporter._log = (...args) => {
        throw 'do not call'
      }

      return new Promise((resolve) => {
        exporter.export([{
          name: 'spanName',
          // @ts-expect-error
          spanContext: () => {
            return {
              traceId: 'traceId',
              spanId: 'spanId2',
            }
          },
        }], (result) => {
          // @ts-expect-error
          expect(exporter._uniqueTraces['traceId']).not.toEqual('spanId2')
          expect(result.code).toEqual(0)
          resolve()
        })
      })
    })

    it('ignores the end of the second span with a unique trace', () => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      exporter.export([{
        name: 'spanName',
        // @ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], () => {})

      // @ts-expect-error
      exporter._log = (...args) => {
        throw 'do not call'
      }

      return new Promise((resolve) => {
        exporter.export([{
          name: 'spanName',
          ended: true,
          // @ts-expect-error
          spanContext: () => {
            return {
              traceId: 'traceId',
              spanId: 'spanId2',
            }
          },
        }], (result) => {
          expect(result.code).toEqual(0)
          resolve()
        })
      })
    })

    it('logs the end of the first span with a unique trace', () => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      exporter.export([{
        name: 'spanName',
        // @ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], () => {})

      // @ts-expect-error
      exporter._log = (...args) => {
        // eslint-disable-next-line no-console
        console.log(args)
        expect(args[0]).toEqual('Trace end: [spanName] - https://ui.honeycomb.io/team/environments/environment/datasets/serviceName/trace?trace_id=traceId')
      }

      return new Promise((resolve) => {
        exporter.export([{
          name: 'spanName',
          ended: true,
          // @ts-expect-error
          spanContext: () => {
            return {
              traceId: 'traceId',
              spanId: 'spanId',
            }
          },
        }], (result) => {
          expect(result.code).toEqual(0)
          resolve()
        })
      })
    })
  })
})
