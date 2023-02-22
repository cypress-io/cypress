import { telemetry } from '@packages/telemetry/src/browser'

export const addTelemetryListeners = (getCypress) => {
  const Cypress = getCypress()

  Cypress.on('test:before:run', (test) => {
    // For some reason we're getting a 'test:before:run' event with no test
    if (test.id) {
      const span = telemetry.startSpan({ name: `test:${test.id}:${test.title}`, active: true })

      span?.setAttribute('title', test.title)
    }
  })

  Cypress.on('test:after:run', (test) => {
    // I haven't seen a test:after:run event without a test, but just to be safe.
    if (test.id) {
      telemetry.getSpan(`test:${test.id}:${test.title}`)?.end()
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
