import { telemetry } from '@packages/telemetry/src/browser'

export const addTelemetryListeners = (getCypress) => {
  const Cypress = getCypress()

  Cypress.on('test:before:run', (attributes, test) => {
    // we emit the 'test:before:run' events within various driver tests
    if (test?.fullTitle()) {
      // If a span for a previous test hasn't been ended, end it before starting the new test span
      const previousTestSpan = telemetry.findActiveSpan((span) => {
        return span?.name.startsWith('test:')
      })

      if (previousTestSpan) {
        telemetry.endActiveSpanAndChildren(previousTestSpan)
      }

      const span = telemetry.startSpan({ name: `test:${test.fullTitle()}`, active: true })

      span?.setAttributes({
        currentRetry: attributes.currentRetry,
      })
    }
  })

  Cypress.on('test:after:run', (attributes, test) => {
    // I haven't seen a test:after:run event without a test, but just to be safe.
    if (test?.fullTitle()) {
      const span = telemetry.getSpan(`test:${test.fullTitle()}`)

      span?.setAttributes({
        timings: JSON.stringify(attributes.timings),
      })

      span?.end()
    }
  })

  // Enable the following events to track timings for individual commands

  // Cypress.on('command:start', (command) => {
  //   const span = telemetry.startSpan({
  //     name: `${command.attributes.runnableType}: ${command.attributes.name}(${command.attributes.args.join(',')})`,
  //   })

  //   span?.setAttribute('command-name', command.attributes.name)
  //   span?.setAttribute('runnable-type', command.attributes.runnableType)
  // })

  // Cypress.on('command:end', (command) => {
  //   const span = telemetry.startSpan({
  //     name: `${command.attributes.runnableType}: ${command.attributes.name}(${command.attributes.args.join(',')})`,
  //   })

  //   span?.setAttribute('state', command.state)
  //   span?.setAttribute('numLogs', command.logs?.length || 0)
  //   span?.end()
  // })
}
