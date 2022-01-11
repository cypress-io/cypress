import Bluebird from 'bluebird'
import { createDeferred, Deferred } from '../../util/deferred'
import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import { difference } from '../../util/difference'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State, config: Cypress.InternalConfig) {
  let timeoutId

  // @ts-ignore
  const communicator = Cypress.multiDomainCommunicator

  communicator.on('html:received', () => {
    // when a secondary domain is detected by the proxy, it holds it up
    // to provide time for the spec bridge to be set up. normally, the queue
    // will not continue until the page is stable, but this signals it to go
    // ahead because we're anticipating multi-domain
    // @ts-ignore
    cy.isAnticipatingMultidomain(true)

    // cy.isAnticipatingMultidomain(true) will free the queue to move forward.
    // if the next command isn't switchToDomain, this timeout will hit and
    // the test will fail with a cross-origin error
    timeoutId = setTimeout(() => {
      Cypress.backend('ready:for:domain', { shouldInject: false })
    }, 2000)
  })

  Commands.addAll({
    switchToDomain<T> (domain: string, dataOrFn: T | (() => {}), fn?: (data?: T) => {}) {
      clearTimeout(timeoutId)

      if (!config('experimentalMultiDomain')) {
        $errUtils.throwErrByPath('switchToDomain.experiment_not_enabled')
      }

      const callbackFn = (fn ?? dataOrFn) as (data?: T) => {}
      const data = fn ? dataOrFn : undefined

      const log = Cypress.log({
        name: 'switchToDomain',
        type: 'parent',
        message: domain,
        end: true,
      })

      if (typeof domain !== 'string') {
        $errUtils.throwErrByPath('switchToDomain.invalid_domain_argument', {
          onFail: log,
          args: { arg: $utils.stringify(domain) },
        })
      }

      if (typeof callbackFn !== 'function') {
        $errUtils.throwErrByPath('switchToDomain.invalid_fn_argument', {
          onFail: log,
          args: { arg: $utils.stringify(callbackFn) },
        })
      }

      // these are proxy commands that represent real commands in a
      // secondary domain. this way, the queue runs in the primary domain
      // with all commands, making it possible to sync up timing for
      // the reporter command log, etc
      const commands: { [key: string]: {
        deferred: Deferred
        name: string
      }} = {}

      const logs: { [key: string]: {
        deferred: Deferred
        log: Cypress.Log
      }} = {}

      const addCommand = (attrs) => {
        const deferred = createDeferred()

        commands[attrs.id] = {
          deferred,
          name: attrs.name,
        }

        attrs.fn = () => {
          // the real command running in the secondary domain handles its
          // own timeout
          // TODO: add a special, long timeout in case inter-domain
          // communication breaks down somehow
          cy.clearTimeout()

          communicator.toSpecBridge('run:command', {
            name: attrs.name,
          })

          return deferred.promise
        }

        Cypress.action('cy:enqueue:command', attrs)
      }

      const updateCommand = ({ id, end }) => {
        if (end) {
          const command = commands[id]

          if (command) {
            delete commands[id]
            command.deferred.resolve()
          }
        }
      }

      const onLogAdded = ({ logAdded }) => {
        const attrs = logAdded

        attrs.consoleProps = () => logAdded.consoleProps
        attrs.renderProps = () => logAdded.renderProps

        const log = Cypress.log(attrs)

        // if the log needs to stream updates, defer its result to make sure all streamed updates come in
        if (!attrs.ended) {
          logs[log.get('id')] = {
            log,
            deferred: createDeferred(),
          }
        }
      }

      const onLogChanged = ({ logChanged }) => {
        const { deferred, log } = logs[logChanged.id]

        // NOTE: Cypress.LogConfig only contains partial types of what exists on the log attributes, missing a lot of 'private' properties
        const logAttrs = log.get()

        const updatedLogAttributes: Partial<Cypress.Log> = difference(logChanged, logAttrs)

        _.forEach(updatedLogAttributes, (value, key) => {
          // if the updated value from the secondary domain is undefined, null, or an empty object/array, skip the update
          if (value !== undefined && value !== null && !(_.isObject(value) && _.isEmpty(value))) {
            log.set(key as keyof Cypress.LogConfig, value)
          }
        })

        const isEnded = log.get('ended' as keyof Cypress.LogConfig)

        if (isEnded) {
          delete logs[logChanged.id]
          deferred.resolve()
        }
      }

      communicator.on('command:enqueued', addCommand)
      communicator.on('command:update', updateCommand)

      communicator.on('log:added', onLogAdded)
      communicator.on('log:changed', onLogChanged)

      const cleanupCommands = () => {
        communicator.off('command:enqueued', addCommand)

        // don't allow for new commands to be enqueued, but wait for commands to update in the secondary domain
        const pendingCommands = _.map(commands, (command) => command.deferred.promise)

        return Promise.all(pendingCommands).then(() => {
          communicator.off('command:update', updateCommand)
        })
      }

      const cleanupLogs = () => {
        communicator.off('log:added', onLogAdded)

        // don't allow for new logs to be added, but wait for logs to update changes in the secondary domain
        const pendingLogs = _.map(logs, (log) => log.deferred.promise)

        return Promise.all(pendingLogs).then(() => {
          communicator.off('log:changed', onLogChanged)
        })
      }

      return new Bluebird((resolve, reject) => {
        communicator.once('ran:domain:fn', () => {
          // if 'done is NOT passed in (add support once #19465 is merged in)
          // all commands in the secondary should be enqueued here. go ahead and bind the cleanup method for when the queue finishes
          // if done is passed in, wait to unbind this method
          // if no commands are enqueued, clean up the logs
          // this case is common if there are only assertions enqueued in the secondary domain
          if (_.size(commands) === 0) {
            cleanupLogs()
            cleanupCommands()
          }

          resolve()
        })

        // otherwise, if commands are queued, wait for them to finish in the secondary domain and then start the cleanup methods
        communicator.once('queue:finished', () => {
          cleanupCommands()
          cleanupLogs()
        })

        // fired once the spec bridge is set up and ready to
        // receive messages
        communicator.once('bridge:ready', () => {
          state('readyForMultidomain', true)
          // let the proxy know to let the response for the secondary
          // domain html through, so the page will finish loading
          Cypress.backend('ready:for:domain', { shouldInject: true })
        })

        cy.once('internal:window:load', ({ type }) => {
          if (type !== 'cross:domain') return

          // once the secondary domain page loads, send along the
          // user-specified callback to run in that domain
          try {
            communicator.toSpecBridge('run:domain:fn', {
              data,
              fn: callbackFn.toString(),
            })
          } catch (err: any) {
            const wrappedErr = $errUtils.errByPath('switchToDomain.run_domain_fn_errored', {
              error: err.message,
            })

            cleanupLogs()
            cleanupCommands()
            reject(wrappedErr)
          }

          state('readyForMultidomain', false)
          // @ts-ignore
          cy.isAnticipatingMultidomain(false)
        })

        // this signals to the runner to create the spec bridge for
        // the specified domain
        communicator.emit('expect:domain', domain)
      })
    },
  })
}
