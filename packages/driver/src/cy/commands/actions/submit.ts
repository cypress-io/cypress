import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'

interface InternalSubmitOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable>{
  _log?: any
  $el: JQuery<HTMLFormElement>
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({ prevSubject: 'element' }, {
    submit (subject, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const _options: InternalSubmitOptions = _.defaults({}, options, {
        log: true,
        $el: subject,
      })

      // changing this to a promise .map() causes submit events
      // to break when they need to be triggered synchronously
      // like with type {enter}.  either convert type to a promise
      // to just create a synchronous submit function
      const form = _options.$el.get(0)

      if (_options.log) {
        _options._log = Cypress.log({
          $el: _options.$el,
          timeout: _options.timeout,
          consoleProps () {
            return {
              'Applied To': $dom.getElements(_options.$el),
              Elements: _options.$el.length,
            }
          },
        })

        _options._log.snapshot('before', { next: 'after' })
      }

      if (!_options.$el.is('form')) {
        const node = $dom.stringify(_options.$el)
        const word = $utils.plural(_options.$el, 'contains', 'is')

        $errUtils.throwErrByPath('submit.not_on_form', {
          onFail: _options._log,
          args: { node, word },
        })
      }

      if (_options.$el.length && _options.$el.length > 1) {
        $errUtils.throwErrByPath('submit.multiple_forms', {
          onFail: _options._log,
          args: { num: _options.$el.length },
        })
      }

      // calling the native submit method will not actually trigger
      // a submit event, so we need to dispatch this manually so
      // native event listeners and jquery can bind to it
      const submit = new Event('submit', { bubbles: true, cancelable: true })
      const dispatched = form.dispatchEvent(submit)

      // now we need to check to see if we should actually submit the form!
      // dont submit the form if our dispatched event was canceled (false)
      if (dispatched) {
        form.submit()
      }

      cy.timeout($actionability.delay, true)

      return Promise
      .delay($actionability.delay, 'submit')
      .then(() => {
        const verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(_options.$el, _options, {
            onRetry: verifyAssertions,
          })
        }

        return verifyAssertions()
      })
    },
  })
}
