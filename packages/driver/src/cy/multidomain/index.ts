import Bluebird from 'bluebird'
import { createDeferred } from '../../util/deferred'
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
      const commands = {}
      const logs = {}

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

      const updateCommand = (details) => {
        if (details.end) {
          const command = commands[details.id]

          if (command) {
            delete commands[details.id]
            command.deferred.resolve()
          }
        }
      }

      const onLogAdded = ({ logAdded }) => {
        const attrs = logAdded

        attrs.consoleProps = () => logAdded.consoleProps
        attrs.renderProps = () => logAdded.renderProps

        const log = Cypress.log(attrs)

        // if the log needs to stream updates, defer its result
        if (!attrs.ended) {
          logs[log.get('id')] = {
            log,
            deferred: createDeferred(),
          }
        }

        return
      }

      const onLogChanged = ({ logChanged }) => {
        const readableLog = logs[logChanged.id].log.get()

        const diff = difference(logChanged, readableLog)

        Object.keys(diff).forEach((key) => {
          const logResults = logChanged[key]

          // TODO: whitelist params but try this first to see if problem resolves
          // if its undefined or null, but is an object that is empty, skip it
          if (logResults !== undefined && logResults !== null && !(_.isObject(logResults) && _.isEmpty(logResults))) {
            logs[logChanged.id].log.set(key, logResults)
          }
        })

        const isEnded = logs[logChanged.id].log.get('ended')

        if (isEnded) {
          const log = logs[logChanged.id]

          delete logs[logChanged.id]
          log.deferred.resolve()
        }

        return
      }

      communicator.on('command:enqueued', addCommand)
      communicator.on('command:update', updateCommand)

      communicator.on('log:added', onLogAdded)
      communicator.on('log:changed', onLogChanged)

      const cleanup = async () => {
        communicator.off('command:enqueued', addCommand)
        communicator.off('log:added', onLogAdded)

        // don't allow for new commands to be enqueued, but wait for commands to update in the secondary domain
        const pendingCommands = Object.keys(commands).map((command) => commands[command].deferred.promise)
        const pendingLogs = Object.keys(logs).filter((log) => logs[log]?.deferred).map((log) => logs[log].deferred.promise)

        return Promise.all(pendingCommands.concat(pendingLogs)).then(() => {
          communicator.off('command:update', updateCommand)
          communicator.off('log:changed', onLogChanged)
        })
      }

      return new Bluebird((resolve, reject) => {
        communicator.once('ran:domain:fn', () => {
          // if 'done is NOT passed in
          // all commands in the secondary should be enqueued here. go ahead and bind the cleanup method for when the queue finishes
          // if done is passed in, wait to unbind this method
          // cleanup()
          resolve()
        })

        communicator.once('queue:finished', cleanup)

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
