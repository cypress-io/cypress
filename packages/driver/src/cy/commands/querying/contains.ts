import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import $errUtils from '../../../cypress/error_utils'
import type { Log } from '../../../cypress/log'

interface InternalContainsOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.CaseMatchable & Cypress.Shadow> {
  _log?: Log
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({ prevSubject: ['optional', 'window', 'document', 'element'] }, {
    contains (subject, filter, text, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.CaseMatchable & Cypress.Shadow> = {}) {
      // nuke our subject if its present but not an element.
      // in these cases its either window or document but
      // we dont care.
      // we'll null out the subject so it will show up as a parent
      // command since its behavior is identical to using it
      // as a parent command: cy.contains()
      // don't nuke if subject is a shadow root, is a document not an element
      if (subject && !$dom.isElement(subject) && !$elements.isShadowRoot(subject[0])) {
        subject = null
      }

      if (_.isRegExp(text)) {
        // .contains(filter, text)
        // Do nothing
      } else if (_.isObject(text)) {
        // .contains(text, userOptions)
        userOptions = text
        text = filter
        filter = ''
      } else if (_.isUndefined(text)) {
        // .contains(text)
        text = filter
        filter = ''
      }

      // https://github.com/cypress-io/cypress/issues/1119
      if (text === 0) {
        // text can be 0 but should not be falsy
        text = '0'
      }

      if (userOptions.matchCase === true && _.isRegExp(text) && text.flags.includes('i')) {
        $errUtils.throwErrByPath('contains.regex_conflict')
      }

      const options: InternalContainsOptions = _.defaults({}, userOptions, { log: true, matchCase: true })

      if (!(_.isString(text) || _.isFinite(text) || _.isRegExp(text))) {
        $errUtils.throwErrByPath('contains.invalid_argument')
      }

      if (_.isBlank(text)) {
        $errUtils.throwErrByPath('contains.empty_string')
      }

      const getPhrase = () => {
        if (filter && subject) {
          const node = $dom.stringify(subject, 'short')

          return `within the element: ${node} and with the selector: '${filter}' `
        }

        if (filter) {
          return `within the selector: '${filter}' `
        }

        if (subject) {
          const node = $dom.stringify(subject, 'short')

          return `within the element: ${node} `
        }

        return ''
      }

      const getErr = (err) => {
        const { type, negated } = err

        if (type === 'existence') {
          if (negated) {
            return `Expected not to find content: '${text}' ${getPhrase()}but continuously found it.`
          }

          return `Expected to find content: '${text}' ${getPhrase()}but never did.`
        }

        return null
      }

      let consoleProps

      if (options.log !== false) {
        consoleProps = {
          Content: text,
          'Applied To': $dom.getElements(subject || state('withinSubject')),
        }

        options._log = Cypress.log({
          message: _.compact([filter, text]),
          type: subject ? 'child' : 'parent',
          timeout: options.timeout,
          consoleProps: () => {
            return consoleProps
          },
        })
      }

      const setEl = ($el) => {
        if (options.log === false) {
          return
        }

        consoleProps.Yielded = $dom.getElements($el)
        consoleProps.Elements = $el != null ? $el.length : undefined

        options._log!.set({ $el })
      }

      // find elements by the :cy-contains psuedo selector
      // and any submit inputs with the attributeContainsWord selector
      const selector = $dom.getContainsSelector(text, filter, options)

      const resolveElements = () => {
        const getOptions = _.extend({}, options, {
          // error: getErr(text, phrase)
          withinSubject: subject || state('withinSubject') || cy.$$('body'),
          filter: true,
          log: false,
          // retry: false ## dont retry because we perform our own element validation
          verify: false, // dont verify upcoming assertions, we do that ourselves
        })

        return cy.now('get', selector, getOptions).then(($el) => {
          if ($el && $el.length) {
            $el = $dom.getFirstDeepestElement($el)
          }

          setEl($el)

          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements,
            onFail (err) {
              switch (err.type) {
                case 'length':
                  if (err.expected > 1) {
                    return $errUtils.throwErrByPath('contains.length_option', { onFail: options._log })
                  }

                  break
                case 'existence':
                  return err.message = getErr(err)
                default:
                  break
              }

              return null
            },
          })
        })
      }

      return Promise
      .try(resolveElements)
    },
  })
}
