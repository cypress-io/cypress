import { telemetry } from '@packages/telemetry/src/browser'

export const addTelemetryListeners = (getCypress) => {
  const Cypress = getCypress()

  Cypress.on('test:before:run', (attributes, test) => {
    // we emits 'test:before:run' events within various driver tests
    if (test?.fullTitle()) {
      // If a span for a previous test hasn't been ended, end it before starting the new test span
      const previousTestSpan = telemetry.findActiveSpan((span) => {
        return span?.name.startsWith('test:')
      })

      if (previousTestSpan) {
        telemetry.endActiveSpanAndChildren(previousTestSpan)
      }

      const span = telemetry.startSpan({ name: `test:${test.fullTitle()}`, active: true })

      // I feel like we should be able to access more test data from cypress but need to look into it more.
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

  // Cypress.on('command:start', (command) => {
  //   // console.log('telemetry events! command:start', command)
  //   const span = telemetry.startSpan({ name: command.attributes.id })

  //   span?.setAttribute('command-name', command.attributes.name)
  // })

  // Cypress.on('command:end', (command) => {
  //   // console.log('telemetry events! command:end', command)
  //   const span = telemetry.getSpan(command.attributes.id)
  Cypress.on('command:start', (command) => {
    const span = telemetry.startSpan({
      name: `${command.attributes.runnableType}: ${command.attributes.name}(${command.attributes.args.join(',')})`,
    })

    span?.setAttribute('command-name', command.attributes.name)
    span?.setAttribute('runnable-type', command.attributes.runnableType)
  })

  //   span?.setAttribute('state', command.state)
  //   span?.end()
  // })
  Cypress.on('command:end', (command) => {
    const span = telemetry.startSpan({
      name: `${command.attributes.runnableType}: ${command.attributes.name}(${command.attributes.args.join(',')})`,
    })

    span?.setAttribute('state', command.state)
    span?.setAttribute('numLogs', command.logs?.length || 0)
    span?.end()
  })

  // Cypress.on('run:end', async () => {
  //   await telemetry.forceFlush()
  // })
}
