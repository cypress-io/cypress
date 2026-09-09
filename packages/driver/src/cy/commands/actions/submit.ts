import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import type { Log } from '../../../cypress/log'

interface InternalSubmitOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable>{
  _log?: Log
  $el: JQuery<HTMLFormElement>
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({ prevSubject: 'element' }, {
    submit (subject: JQuery<HTMLFormElement>, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalSubmitOptions = _.defaults({}, userOptions, {
        log: true,
        $el: subject,
      })

      // changing this to a promise .map() causes submit events
      // to break when they need to be triggered synchronously
      // like with type {enter}.  either convert type to a promise
      // to just create a synchronous submit function
      const form = options.$el.get(0)

      options._log = Cypress.log({
        $el: options.$el,
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          return {
            'Applied To': $dom.getElements(options.$el),
            Elements: options.$el.length,
          }
        },
      })

      options._log?.snapshot('before', { next: 'after' })

      if (!options.$el.is('form')) {
        const node = $dom.stringify(options.$el)
        const word = $utils.plural(options.$el, 'contains', 'is')

        $errUtils.throwErrByPath('submit.not_on_form', {
          onFail: options._log,
          args: { node, word },
        })
      }

      if (options.$el.length && options.$el.length > 1) {
        $errUtils.throwErrByPath('submit.multiple_forms', {
          onFail: options._log,
          args: { num: options.$el.length },
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
          return cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions,
          })
        }

        return verifyAssertions()
      })
    },
  })
}
