import Bluebird from 'bluebird'
import $Log from '../../cypress/log'
import { createDeferred } from '../../util/deferred'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State) {
  // @ts-ignore
  Cypress.on('cross:domain:html:received', () => {
    state('anticipateMultidomain', true)

    // when a secondary domain is detected by the proxy, it holds it up
    // to provide time for the spec bridge to be set up. however, the
    // queue won't continue running until the page is stable, so we
    // lie and say it's stable to allow the queue to run, then work
    // out the actual stability of the page later.
    // TODO: maybe create a different signal that isn't stability-based,
    // but lets the queue go ahead and then later signal stability?
    // @ts-ignore
    cy.isStable(true, 'load')
  })

  Commands.addAll({
    // this isn't fully implemented, but in place to be able to test out
    // the other parts of multidomain
    switchToDomain (domain, fn) {
      Cypress.log({
        name: 'switchToDomain',
        type: 'parent',
        message: domain,
        end: true,
      })

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
          // @ts-ignore
          cy.clearTimeout()

          Cypress.action('cy:cross:domain:message', {
            message: 'run:command',
          })

          return deferred.promise
        }

        Cypress.action('cy:enqueue:command', attrs)
      }

      const updateCommand = (details) => {
        if (details.logAdded) {
          const attrs = details.logAdded

          attrs.consoleProps = () => details.logAdded.consoleProps
          attrs.renderProps = () => details.logAdded.renderProps

          const log = Cypress.log(attrs)

          logs[log.get('id')] = log

          return
        }

        if (details.logChanged) {
          const log = logs[details.logChanged.id]

          if (log) {
            log.set(details.logChanged)
          }

          return
        }

        if (details.end) {
          const command = commands[details.id]

          if (command) {
            delete commands[details.id]
            command.deferred.resolve()
          }
        }
      }

      // @ts-ignore
      Cypress.on('cross:domain:command:enqueued', addCommand)
      // @ts-ignore
      Cypress.on('cross:domain:command:update', updateCommand)

      return new Bluebird((resolve) => {
        // @ts-ignore
        Cypress.once('cross:domain:ran:domain:fn', () => {
          resolve()
        })

        // @ts-ignore
        Cypress.once('cross:domain:queue:finished', () => {
          // @ts-ignore
          Cypress.off('cross:domain:command:enqueued', addCommand)
          // @ts-ignore
          Cypress.off('cross:domain:command:update', updateCommand)
        })

        // fired once the spec bridge is set up and ready to
        // receive messages
        // @ts-ignore
        Cypress.once('cross:domain:bridge:ready', () => {
          // let the proxy know to let the response for the secondary
          // domain html through, so the page will finish loading
          // @ts-ignore
          Cypress.backend('ready:for:domain')
        })

        // @ts-ignore
        cy.once('cross:domain:window:load', () => {
          // once the secondary domain page loads, send along the
          // user-specified callback to run in that domain
          Cypress.action('cy:cross:domain:message', {
            message: 'run:domain:fn',
            // the log count needs to be synced between domains so logs
            // are guaranteed to have unique ids
            logCounter: $Log.getCounter(),
            fn: fn.toString(),
          })

          state('anticipateMultidomain', false)
        })

        // this signals to the runner to create the spec bridge for
        // the specified domain
        Cypress.action('cy:expect:domain', '127.0.0.1:3501')
      })
    },
  })
}
