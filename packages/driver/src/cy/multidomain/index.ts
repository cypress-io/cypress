import Bluebird from 'bluebird'
import * as $Log from '../../cypress/log'
import { createDeferred } from '../../util/deferred'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State) {
  Commands.addAll({
    anticipateMultidomain () {
      state('anticipateMultidomain', true)

      return new Bluebird((resolve) => {
        // @ts-ignore
        Cypress.once('cross:domain:bridge:ready', () => {
          resolve()
        })

        Cypress.action('cy:expect:domain', '127.0.0.1:3501')
      })
    },

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

        Cypress.action('cy:cross:domain:message', {
          message: 'run:domain:fn',
          logCounter: $Log.getCounter(),
          fn: fn.toString(),
        })
      })
    },
  })
}
