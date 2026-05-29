import _ from 'lodash'
import Bluebird from 'bluebird'
import Debug from 'debug'
import * as plugins from './plugins'

const debug = Debug('cypress:server:task')

const CYPRESS_UNHANDLED_TASK = '__cypress_unhandled__' as const

interface TaskRunOptions {
  task: string
  arg?: unknown
  timeout: number
}

interface KnownTaskError extends Error {
  isKnownError: true
}

interface TaskTimeoutError extends Error {
  timedOut: true
}

const throwKnownError = (message: string, props: Record<string, unknown> = {}): never => {
  const err = new Error(message) as KnownTaskError

  _.extend(err, props, { isKnownError: true })
  throw err
}

export function run (
  configFilePath: string | null,
  options: TaskRunOptions,
): Bluebird<unknown> {
  debug('run task', options.task, 'with arg', options.arg)

  const fileText = configFilePath ? `\n\nFix this in your setupNodeEvents method here:\n${configFilePath}` : ''

  return Bluebird
  .try(() => {
    if (!plugins.has('task')) {
      debug('\'task\' event is not registered')
      throwKnownError(`The 'task' event has not been registered in the setupNodeEvents method. You must register it before using cy.task()${fileText}`)
    }

    return plugins.execute('task', options.task, options.arg)
  }).then((result) => {
    if (result === CYPRESS_UNHANDLED_TASK) {
      debug('task is unhandled')

      return plugins.execute('_get:task:keys').then((keys: string[]) => {
        return throwKnownError(`The task '${options.task}' was not handled in the setupNodeEvents method. The following tasks are registered: ${keys.join(', ')}${fileText}`)
      })
    }

    if (result === undefined) {
      debug('result is undefined')

      return plugins.execute('_get:task:body', options.task).then((body: string) => {
        const handler = body ? `\n\nThe task handler was:\n\n${body}` : ''

        return throwKnownError(`The task '${options.task}' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.${handler}${fileText}`)
      })
    }

    debug('result is:', result)

    return result
  }).timeout(options.timeout)
  .catch(Bluebird.TimeoutError, () => {
    debug(`timed out after ${options.timeout}ms`)

    return plugins.execute('_get:task:body', options.task).then((body: string) => {
      const err = new Error(`The task handler was:\n\n${body}${fileText}`) as TaskTimeoutError

      err.timedOut = true
      throw err
    })
  })
}
