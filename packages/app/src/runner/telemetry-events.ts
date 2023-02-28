import { telemetry } from '@packages/telemetry/src/browser'

export const addTelemetryListeners = (getCypress) => {
  const Cypress = getCypress()

  Cypress.on('test:before:run', (test) => {
    // For some reason we're getting a 'test:before:run' event with no test
    if (test.title) {
      // If a span for a previous test hasn't been ended, end it before starting the new test span
      const previousTestSpan = telemetry.findActiveSpan((span) => {
        return span?.name.startsWith('test:')
      })

      if (previousTestSpan) {
        telemetry.endActiveSpanAndChildren(previousTestSpan)
      }

      const span = telemetry.startSpan({ name: `test:${test.title}`, active: true })

      // I feel like we should be able to access more test data from cypress but need to look into it more.
      span?.setAttributes({
        currentRetry: test.currentRetry,
      })
    }
  })

  Cypress.on('test:after:run', (test) => {
    // I haven't seen a test:after:run event without a test, but just to be safe.
    if (test.title) {
      const span = telemetry.getSpan(`test:${test.title}`)

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

  //   span?.setAttribute('state', command.state)
  //   span?.end()
  // })

  // Cypress.on('run:end', async () => {
  //   await telemetry.forceFlush()
  // })
}
