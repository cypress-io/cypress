import _ from 'lodash'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import { resolveShadowDomInclusion } from '../../../cypress/shadow_dom_utils'

export default (Commands, Cypress, cy, state) => {
  Commands.addSelector('getS', null, function get (selector, userOptions: Partial<Cypress.Loggable & Cypress.Withinable & Cypress.Shadow> = {}) {
    if ((userOptions === null) || _.isArray(userOptions) || !_.isPlainObject(userOptions)) {
      $errUtils.throwErrByPath('get.invalid_options', {
        args: { options: userOptions },
      })
    }

    const withinSubject = state('withinSubject')
    const includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)

    const consoleProps: Record<string, any> = {}
    const log = userOptions.log !== false && Cypress.log({
      message: selector,
      aliasType: 'dom',
      timeout: userOptions.timeout,
      consoleProps: () => {
        return consoleProps
      },
    })

    cy.state('current').set('timeout', userOptions.timeout)

    return (subject) => {
      let $el

      try {
        let scope: (typeof withinSubject) | Node[] = withinSubject

        if (includeShadowDom) {
          const root = withinSubject ? withinSubject[0] : cy.state('document')
          const elementsWithShadow = $dom.findAllShadowRoots(root)

          scope = elementsWithShadow.concat(root)
        }

        $el = cy.$$(selector, scope)

        // jQuery v3 has removed its deprecated properties like ".selector"
        // https://jquery.com/upgrade-guide/3.0/breaking-change-deprecated-context-and-selector-properties-removed
        // but our error messages use this property to actually show the missing element
        // so let's put it back
        if ($el.selector == null) {
          $el.selector = selector
        }
      } catch (err: any) {
        // this is usually a sizzle error (invalid selector)
        if (log) {
          err.onFail = () => log.error(err)
        }

        throw err
      }

      // if that didnt find anything and we have a within subject
      // and we have been explictly told to filter
      // then just attempt to filter out elements from our within subject
      if (!$el.length && withinSubject && userOptions.filter) {
        const filtered = (withinSubject as JQuery).filter(selector)

        // reset $el if this found anything
        if (filtered.length) {
          $el = filtered
        }
      }

      log.set({
        $el,
        consoleProps: () => {
          return {
            Selector: selector,
            Yielded: $dom.getElements($el),
            Elements: $el.length,
          }
        },
      })

      try {
        cy.ensureElExistence($el, this)
      } catch (err) {
        if (log) {
          err.onFail = () => log.error(err)
        }

        throw err
      }

      return $el
    }
  })
}
