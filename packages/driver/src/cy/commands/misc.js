// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')

const $dom = require('../../dom')

module.exports = function (Commands, Cypress, cy, state, config) {
  Commands.addAll({ prevSubject: 'optional' }, {
    end () {
      return null
    },
  })

  return Commands.addAll({
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
      let resolveWrap

      _.defaults(options, { log: true })

      if (options.log !== false) {
        options._log = Cypress.log()

        if ($dom.isElement(arg)) {
          options._log.set({ $el: arg })
        }
      }

      return (resolveWrap = () => {
        return cy.verifyUpcomingAssertions(arg, options, {
          onRetry: resolveWrap,
        })
        .return(arg)
      })()
    },
  })
}
