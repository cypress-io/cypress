const _ = require('lodash')

const $dom = require('../../dom')

module.exports = (Commands, Cypress, cy) => {
  Commands.addAll({ prevSubject: 'optional' }, {
    end () {
      return null
    },
  })

  Commands.addAll({
    noop (arg) {
      return arg
    },

    log (msg, args) {
      Cypress.log({
        end: true,
        snapshot: true,
        message: [msg, args],
        consoleProps () {
          return {
            message: msg,
            args,
          }
        },
      })

      return null
    },

    wrap (arg, options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log !== false) {
        options._log = Cypress.log({
          message: arg,
        })

        if ($dom.isElement(arg)) {
          options._log.set({ $el: arg })
        }
      }

      const resolveWrap = () => {
        return cy.verifyUpcomingAssertions(arg, options, {
          onRetry: resolveWrap,
        })
        .return(arg)
      }

      return resolveWrap()
    },
  })
}
