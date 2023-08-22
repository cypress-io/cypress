import { telemetry } from '@packages/telemetry/src/browser'

export const addTelemetryListeners = (Cypress: Cypress.Cypress) => {
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
      })

      span?.end()
    } catch (error) {
      // TODO: log error when client side debug logging is available
    }
  })

  const commandSpanInfo = (command: Cypress.CommandQueue) => {
    const runnable = Cypress.state('runnable')
    const runnableType = runnable.type === 'hook' ? runnable.hookName : runnable.type

    return {
      name: `${runnableType}: ${command.attributes.name}(${command.attributes.args.join(',')})`,
      runnable,
      runnableType,
    }
  }

  Cypress.on('command:start', (command: Cypress.CommandQueue) => {
    try {
      const test = Cypress.state('test')

      const { name, runnable, runnableType } = commandSpanInfo(command)

      const span = telemetry.startSpan({
        name,
        opts: {
          attributes: {
            spec: runnable.invocationDetails.relativeFile,
            test: `test:${test.fullTitle()}`,
            'runnable-type': runnableType,
          },
        },
        isVerbose: true,
      })

      span?.setAttribute('command-name', command.attributes.name)
    } catch (error) {
    // TODO: log error when client side debug logging is available
    }
  })

  const onCommandEnd = (command: Cypress.CommandQueue) => {
    try {
      const span = telemetry.getSpan(commandSpanInfo(command).name)

      span?.setAttribute('state', command.state)
      span?.setAttribute('numLogs', command.logs?.length || 0)
      span?.end()
    } catch (error) {
    // TODO: log error when client side debug logging is available
    }
  }

  Cypress.on('command:end', onCommandEnd)

  Cypress.on('skipped:command:end', onCommandEnd)

  Cypress.on('command:failed', (command: Cypress.CommandQueue, error: Error) => {
    try {
      const span = telemetry.getSpan(commandSpanInfo(command).name)

      span?.setAttribute('state', command.state)
      span?.setAttribute('numLogs', command.logs?.length || 0)
      span?.setAttribute('error.name', error.name)
      span?.setAttribute('error.message', error.message)
      span?.end()
    } catch (error) {
    // TODO: log error when client side debug logging is available
    }
  })
}
