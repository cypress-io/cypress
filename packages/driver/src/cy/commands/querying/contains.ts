import _ from 'lodash'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import type { Log } from '../../../cypress/log'

type OtherOpts = Partial<Cypress.GetOptions & { _log?: Log }>

type ContainsOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.CaseMatchable & Cypress.Shadow>

export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('contains', function contains (filter, text, userOptions: ContainsOptions = {}) {
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

    if (!(_.isString(text) || _.isFinite(text) || _.isRegExp(text))) {
      $errUtils.throwErrByPath('contains.invalid_argument')
    }

    if (_.isBlank(text)) {
      $errUtils.throwErrByPath('contains.empty_string')
    }

    // find elements by the :cy-contains psuedo selector
    // and any submit inputs with the attributeContainsWord selector
    const selector = $dom.getContainsSelector(text, filter, { matchCase: true, ...userOptions })

    const log = userOptions.log !== false && Cypress.log({
      message: $utils.stringify(_.compact([filter, text])),
      type: this.hasPreviouslyLinkedCommand ? 'child' : 'parent',
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    })

    const getOptions = _.extend({ _log: log }, userOptions) as OtherOpts
    const getFn = cy.now('get', selector, getOptions)

    const getPhrase = () => {
      if (filter && !(cy.$$(getOptions.withinSubject) as JQuery<HTMLElement>).is('body')) {
        const node = $dom.stringify(getOptions.withinSubject, 'short')

        return `within the element: ${node} and with the selector: '${filter}' `
      }

      if (filter) {
        return `within the selector: '${filter}' `
      }

      if (!(cy.$$(getOptions.withinSubject) as JQuery<HTMLElement>).is('body')) {
        const node = $dom.stringify(getOptions.withinSubject, 'short')

        return `within the element: ${node} `
      }

      return ''
    }

    this.set('timeout', userOptions.timeout)
    this.set('onFail', (err) => {
      switch (err.type) {
        case 'length':
          if (err.expected > 1) {
            const { message, docsUrl } = $errUtils.cypressErrByPath('contains.length_option')

            err.message = message
            err.docsUrl = docsUrl
            err.retry = false
          }

          break
        case 'existence':
          if (err.negated) {
            err.message = `Expected not to find content: '${text}' ${getPhrase()}but continuously found it.`
          } else {
            err.message = `Expected to find content: '${text}' ${getPhrase()}but never did.`
          }

          break
        default:
          break
      }
    })

    const withinSubject = cy.state('withinSubjectChain')

    return (subject) => {
      Cypress.ensure.isType(subject, ['optional', 'element', 'window', 'document'], this.get('name'), cy)

      if (!subject || (!$dom.isElement(subject) && !$elements.isShadowRoot(subject[0]))) {
        subject = cy.getSubjectFromChain(withinSubject || [cy.$$('body')])
      }

      let $el = cy.$$()

      subject.each((index, element) => {
        getOptions.withinSubject = cy.$$(element)
        $el = $el.add(getFn())
      })

      if (!$el.length) {
        // .get() looks for elements *inside* the current subject, while contains() wants to also match the current
        // subject itself if no child matches.
        $el = (subject as JQuery).filter(selector)
      }

      $el = $dom.getFirstDeepestElement($el)

      log && cy.state('current') === this && log.set({
        $el,
        consoleProps: () => {
          return {
            Content: text,
            'Applied To': $dom.getElements(subject),
            Yielded: $el.get(0),
            Elements: $el.length,
          }
        },
      })

      return $el
    }
  })
}
