import { expect } from 'chai'

import { ConsoleTraceLinkExporter } from '../../src/span-exporters/console-trace-link-exporter'

describe('consoleTraceLinkExporter', () => {
  describe('new', () => {
    it('sets up trace url', () => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      //@ts-expect-error
      expect(exporter._traceUrl).to.equal('https://ui.honeycomb.io/team/environments/environment/datasets/serviceName/trace?trace_id')
    })
  })

  describe('export', () => {
    it('logs the start of the first span with a unique trace', (done) => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      //@ts-expect-error
      exporter._log = (...args) => {
        expect(args[0]).to.equal('Trace start: [spanName] - https://ui.honeycomb.io/team/environments/environment/datasets/serviceName/trace?trace_id=traceId')
      }

      exporter.export([{
        name: 'spanName',
        //@ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], (result) => {
        //@ts-expect-error
        expect(exporter._uniqueTraces['traceId']).to.equal('spanId')
        expect(result.code).to.equal(0)
        done()
      })
    })

    it('ignores the start of the second span with a unique trace', (done) => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      exporter.export([{
        name: 'spanName',
        //@ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], () => {})

      //@ts-expect-error
      exporter._log = (...args) => {
        throw 'do not call'
      }

      exporter.export([{
        name: 'spanName',
        //@ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId2',
          }
        },
      }], (result) => {
        //@ts-expect-error
        expect(exporter._uniqueTraces['traceId']).to.not.equal('spanId2')
        expect(result.code).to.equal(0)
        done()
      })
    })

    it('ignores the end of the second span with a unique trace', (done) => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      exporter.export([{
        name: 'spanName',
        //@ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], () => {})

      //@ts-expect-error
      exporter._log = (...args) => {
        throw 'do not call'
      }

      exporter.export([{
        name: 'spanName',
        ended: true,
        //@ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId2',
          }
        },
      }], (result) => {
        expect(result.code).to.equal(0)
        done()
      })
    })

    it('logs the end of the first span with a unique trace', (done) => {
      const exporter = new ConsoleTraceLinkExporter({
        serviceName: 'serviceName',
        team: 'team',
        environment: 'environment',
      })

      exporter.export([{
        name: 'spanName',
        //@ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], () => {})

      //@ts-expect-error
      exporter._log = (...args) => {
        console.log(args)
        expect(args[0]).to.equal('Trace end: [spanName] - https://ui.honeycomb.io/team/environments/environment/datasets/serviceName/trace?trace_id=traceId')
      }

      exporter.export([{
        name: 'spanName',
        ended: true,
        //@ts-expect-error
        spanContext: () => {
          return {
            traceId: 'traceId',
            spanId: 'spanId',
          }
        },
      }], (result) => {
        expect(result.code).to.equal(0)
        done()
      })
    })
  })
})
