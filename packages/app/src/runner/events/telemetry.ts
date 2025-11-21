import { telemetry } from '@packages/telemetry/browser/client'

function startTestOtelSpan (attributes: Cypress.ObjectLike, test: Mocha.Test) {
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
}

function endTestOtelSpan (attributes: Cypress.ObjectLike, test: Mocha.Test) {
  try {
    const span = telemetry.getSpan(`test:${test.fullTitle()}`)

    span?.setAttributes({
      timings: JSON.stringify(attributes.timings),
    })

    span?.end()
  } catch (error) {
    // TODO: log error when client side debug logging is available
  }
}

const commandSpanInfo = (command: Cypress.CommandQueue) => {
  const runnable = Cypress.state('runnable')
  const runnableType = runnable.type === 'hook' ? runnable.hookName : runnable.type

  return {
    name: `${runnableType}: ${command.attributes.name}(${command.attributes.args.join(',')})`,
    runnable,
    runnableType,
  }
}

function startCommandOtelSpan (command: Cypress.CommandQueue) {
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
}

function endCommandOtelSpan (command: Cypress.CommandQueue) {
  try {
    const span = telemetry.getSpan(commandSpanInfo(command).name)

    span?.setAttribute('state', command.state)
    span?.setAttribute('numLogs', command.logs?.length || 0)
    span?.end()
  } catch (error) {
  // TODO: log error when client side debug logging is available
  }
}

function failCommandOtelSpan (command: Cypress.CommandQueue, error: Error) {
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
}

function startCommandPerformanceMark (command: Cypress.CommandQueue) {
  try {
    performance.mark(`cy:command:${command.attributes.id}:start`)
  } catch (error) {
  // TODO: log error when client side debug logging is available
  }
}

function endCommandPerformanceMark (Cypress: Cypress.Cypress) {
  return (command: Cypress.CommandQueue) => {
    try {
      const { id } = command.attributes

      performance.mark(`cy:command:${id}:end`)
      const measure = performance.measure(`cy:command:${id}:measure`, {
        start: `cy:command:${id}:start`,
        end: `cy:command:${id}:end`,
      })

      if (!measure) {
        return
      }

      Cypress.automation('log:command:performance', {
        name: command.attributes.name,
        startTime: measure.startTime,
        duration: measure.duration,
      }).catch(() => {}).finally(() => {
        performance.clearMarks(`cy:command:${id}:start`)
        performance.clearMarks(`cy:command:${id}:end`)
        performance.clearMeasures(`cy:command:${id}:measure`)
      })
    } catch (error) {
      // noop
    }
  }
}

export const addTelemetryListeners = (Cypress: Cypress.Cypress) => {
  Cypress.on('test:before:run', startTestOtelSpan)
  Cypress.on('test:after:run', endTestOtelSpan)
  Cypress.on('command:start', startCommandOtelSpan)
  Cypress.on('command:end', endCommandOtelSpan)
  Cypress.on('command:failed', failCommandOtelSpan)
  Cypress.on('skipped:command:end', endCommandOtelSpan)

  Cypress.on('command:start', startCommandPerformanceMark)
  Cypress.on('command:end', endCommandPerformanceMark(Cypress))
  Cypress.on('skipped:command:end', endCommandPerformanceMark(Cypress))
}
