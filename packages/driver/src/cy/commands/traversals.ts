import _ from 'lodash'

import $dom from '../../dom'
import { resolveShadowDomInclusion } from '../../cypress/shadow_dom_utils'
import $errUtils from '../../cypress/error_utils'
import type { QueryStep } from '../../remote/protocol'
import { subjectChainToString } from '../../cypress/error_messages'
import { extendRemoteSubject, isRemoteDriverEnabled, isRemoteSubject } from '../remote'
import { TRAVERSALS, traverse } from '../../dom/traversal'

type TraversalOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Shadow>

export default (Commands, Cypress, cy) => {
  // the agent runs the traversal in the AUT, so its arguments have to cross as JSON
  const getRemoteStep = (traversal: string, includeShadowDom: boolean, arg1, arg2): QueryStep => {
    const args = [arg1, arg2].filter((arg) => arg !== undefined)

    if (!args.every((arg) => typeof arg === 'string' || typeof arg === 'number')) {
      $errUtils.throwErrByPath('remote_driver.unsupported_argument', { args: { cmd: traversal } })
    }

    return { type: 'traversal', method: traversal, args, includeShadowDom }
  }

  _.each(TRAVERSALS, (traversal) => {
    Commands.addQuery(traversal, function traversalFn (arg1, arg2, userOptions: TraversalOptions = {}) {
      if (_.isObject(arg1) && !_.isFunction(arg1)) {
        userOptions = arg1
      }

      if (_.isObject(arg2) && !_.isFunction(arg2)) {
        userOptions = arg2
      }

      // Omit any null or undefined arguments
      const selector = _.filter([arg1, arg2], (a) => (a != null && !_.isFunction(a) && !_.isObject(a))).join(', ')

      const log = Cypress.log({
        hidden: userOptions.log === false,
        message: selector,
        timeout: userOptions.timeout,
        consoleProps: () => ({}),
      })

      this.set('timeout', userOptions.timeout)

      this.set('onFail', (err) => {
        switch (err.type) {
          case 'existence': {
            const subjectChain = cy.subjectChain(this.get('chainerId'))

            err.message += ` Queried from:

              > ${subjectChainToString(subjectChain)}`

            break
          }
          default:
            break
        }
      })

      const includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)

      return (subject) => {
        if (isRemoteDriverEnabled(Cypress) && isRemoteSubject(subject)) {
          return extendRemoteSubject(traversal, subject, getRemoteStep(traversal, includeShadowDom, arg1, arg2), selector || traversal)
        }

        Cypress.ensure.isType(subject, ['element', 'document'], traversal, cy)

        const $el = traverse(cy.$$, traversal, includeShadowDom, cy.$$(subject), arg1, arg2)

        // normalize the selector since jQuery won't have it
        // or completely borks it
        $el.selector = selector || traversal

        log && cy.state('current') === this && log.set({
          $el,
          consoleProps: () => {
            return {
              Selector: selector,
              'Applied To': $dom.getElements(subject),
              Yielded: $dom.getElements($el),
              Elements: $el?.length,
            }
          },
        })

        return $el
      }
    })
  })
}
