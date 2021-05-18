const _ = require('lodash')
const Promise = require('bluebird')
const debug = require('debug')('cypress:server:task')
const plugins = require('./plugins')

const throwKnownError = function (message, props = {}) {
  const err = new Error(message)

  _.extend(err, props, { isKnownError: true })
  throw err
}

module.exports = {
  run (pluginsFilePath, options) {
    debug('run task', options.task, 'with arg', options.arg)

    const fileText = `\n\nFix this in your plugins file here:\n${pluginsFilePath}`

    return Promise
    .try(() => {
      if (!plugins.has('task')) {
        debug('\'task\' event is not registered')
        throwKnownError(`The 'task' event has not been registered in the plugins file. You must register it before using cy.task()${fileText}`)
      }

      return plugins.execute('task', options.task, options.arg)
    }).then((result) => {
      if (result === '__cypress_unhandled__') {
        debug('task is unhandled')

        return plugins.execute('_get:task:keys').then((keys) => {
          return throwKnownError(`The task '${options.task}' was not handled in the plugins file. The following tasks are registered: ${keys.join(', ')}${fileText}`)
        })
      }

      if (result === undefined) {
        debug('result is undefined')

        return plugins.execute('_get:task:body', options.task).then((body) => {
          const handler = body ? `\n\nThe task handler was:\n\n${body}` : ''

          return throwKnownError(`The task '${options.task}' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.${handler}${fileText}`)
        })
      }

      debug('result is:', result)

      return result
    }).timeout(options.timeout)
    .catch(Promise.TimeoutError, () => {
      debug(`timed out after ${options.timeout}ms`)

      return plugins.execute('_get:task:body', options.task).then((body) => {
        const err = new Error(`The task handler was:\n\n${body}${fileText}`)

        err.timedOut = true
        throw err
      })
    })
  },
}
