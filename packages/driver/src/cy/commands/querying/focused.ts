import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'

interface InternalFocusedOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable>{
  _log?: any
  verify: boolean
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    focused (userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalFocusedOptions = _.defaults({}, userOptions, {
        verify: true,
        log: true,
      })

      if (options.log) {
        options._log = Cypress.log({ timeout: options.timeout })
      }

      const log = ($el) => {
        if (options.log === false) {
          return
        }

        options._log.set({
          $el,
          consoleProps () {
            const ret = $el ? $dom.getElements($el) : '--nothing--'

            return {
              Yielded: ret,
              Elements: $el != null ? $el.length : 0,
            }
          },
        })
      }

      const getFocused = () => {
        const focused = cy.getFocused()

        log(focused)

        return focused
      }

      const resolveFocused = () => {
        return Promise
        .try(getFocused)
        .then(($el) => {
          if (options.verify === false) {
            return $el
          }

          if (!$el) {
            $el = $dom.wrap(null)
            $el.selector = 'focused'
          }

          // pass in a null jquery object for assertions
          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveFocused,
          })
        })
      }

      return resolveFocused()
    },
  })
}
