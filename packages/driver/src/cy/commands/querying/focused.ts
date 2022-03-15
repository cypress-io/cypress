import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'

interface InternalFocusedOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable>{
  _log?: any
  verify: boolean
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    focused (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const _options: InternalFocusedOptions = _.defaults({}, options, {
        verify: true,
        log: true,
      })

      if (_options.log) {
        _options._log = Cypress.log({ timeout: _options.timeout })
      }

      const log = ($el) => {
        if (_options.log === false) {
          return
        }

        _options._log.set({
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
          if (_options.verify === false) {
            return $el
          }

          if (!$el) {
            $el = $dom.wrap(null)
            $el.selector = 'focused'
          }

          // pass in a null jquery object for assertions
          return cy.verifyUpcomingAssertions($el, _options, {
            onRetry: resolveFocused,
          })
        })
      }

      return resolveFocused()
    },
  })
}
