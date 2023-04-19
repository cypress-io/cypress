import type { Span } from '@opentelemetry/api'
import { telemetry } from '@packages/telemetry/src/browser'

export const addTelemetryListeners = (Cypress) => {
  Cypress.on('test:before:run', (attributes, test) => {
    // we emit the 'test:before:run' events within various driver tests
    try {
      // If a span for a previous test hasn't been ended, end it before starting the new test span
      const previousTestSpan = telemetry.findActiveSpan((span) => {
        return span.name.startsWith('test:')
      })

      if (previousTestSpan) {
        telemetry.endActiveSpanAndChildren(previousTestSpan)
      }

      const span = telemetry.startSpan({ name: `test:${test.fullTitle()}`, active: true })

      span?.setAttributes({
        currentRetry: attributes.currentRetry,
      })
    } catch (error) {
      // TODO: log error when client side debug logging is available
    }
  })

  Cypress.on('test:after:run', (attributes, test) => {
    try {
      const span = telemetry.getSpan(`test:${test.fullTitle()}`)

      span?.setAttributes({
        timings: JSON.stringify(attributes.timings),
        state: attributes?.state,
      })

      span?.end()
    } catch (error) {
      // TODO: log error when client side debug logging is available
    }
  })

  const recordSpan = (spanState: 'start' | 'end', command: Cypress.CommandQueue, extendRecordSpanFn: (span?: Span) => void) => {
    try {
      const runnable = Cypress.state('runnable')

      const runnableType = runnable.type === 'hook' ? runnable.hookName : runnable.type

      let span: Span | undefined

      const spanName = `${runnableType}: ${command.attributes.name}(${command.attributes.args.join(',')})`

      if (spanState === 'start') {
        span = telemetry.startSpan({
          name: spanName,
          opts: {
            attributes: {
              spec: runnable.invocationDetails.relativeFile,
              test: `test:${runnable.fullTitle()}`,
              'runnable-type': runnableType,
            },
          },
        })
      } else {
        span = telemetry.getSpan(spanName)
      }

      extendRecordSpanFn(span)
    } catch (error) {
      // TODO: log error when client side debug logging is available
    }
  }

  Cypress.on('command:start', (command: Cypress.CommandQueue) => {
    recordSpan('start', command, (span) => {
      span?.setAttribute('command-name', command.attributes.name)
    })
  })

  Cypress.on('command:end', (command: Cypress.CommandQueue) => {
    recordSpan('end', command, (span) => {
      span?.setAttribute('state', command.state)
      span?.setAttribute('numLogs', command.logs?.length || 0)
      span?.end()
    })
  })

  Cypress.on('command:failed', (command: Cypress.CommandQueue, error: Error) => {
    recordSpan('end', command, (span) => {
      span?.setAttribute('state', command.state)
      span?.setAttribute('numLogs', command.logs?.length || 0)
      span?.setAttribute('error.name', error.name)
      span?.setAttribute('error.message', error.message)
      span?.end()
    })
  })
}
