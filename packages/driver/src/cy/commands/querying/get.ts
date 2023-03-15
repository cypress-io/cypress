import _ from 'lodash'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import type { Log } from '../../../cypress/log'
import { resolveShadowDomInclusion } from '../../../cypress/shadow_dom_utils'
import { getAliasedRequests, isDynamicAliasingPossible } from '../../net-stubbing/aliasing'
import { aliasRe, aliasIndexRe } from '../../aliases'

type GetOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow & {
  _log?: Log
}>

function getAlias (selector, log, cy) {
  const alias = selector.slice(1)

  return () => {
    let toSelect

    // Aliases come in two types: raw names, or names followed by an index.
    // For example, "@foo.bar" or "@foo.bar.1" or "@foo.bar.all", where 1 or all are the index.
    if ((cy.state('aliases') || {})[alias]) {
      toSelect = selector
    } else {
      // If the name isn't in our state, then this is probably a dynamic alias -
      // which is to say, it includes an index.
      toSelect = selector.replace(/\.(\d+|all)$/, '')
    }

    let aliasObj

    try {
      aliasObj = cy.getAlias(toSelect)
    } catch (err) {
      // possibly this is a dynamic alias, check to see if there is a request
      const requests = getAliasedRequests(alias, cy.state)

      if (!isDynamicAliasingPossible(cy.state) || !requests.length) {
        err.retry = false
        throw err
      }

      aliasObj = {
        alias,
        command: cy.state('routes')[requests[0].routeId].command,
      }
    }

    if (!aliasObj) {
      return
    }

    const { command } = aliasObj

    log && cy.state('current') === this && log.set('referencesAlias', { name: alias })

    /*
     * There are two cases for aliases, each explained in more detail below:
     * 1. Intercept aliases
     * 2. Subject aliases (either DOM elements or primitives).
     */

    if (command.get('name') === 'intercept') {
      // Intercept aliases are fairly similar, but `getAliasedRequests` does *not* handle indexes
      // and we have to do it ourselves here.

      const requests = getAliasedRequests(aliasObj.alias, cy.state)

      // If the user provides an index ("@foo.1" or "@foo.all"), use that. Otherwise, return the most recent request.
      const match = selector.match(aliasIndexRe)

      if (match && match[1] === '0') {
        $errUtils.throwErrByPath('get.alias_zero', {
          args: { alias: aliasObj.alias },
        })
      }

      const index = match ? match[1] : requests.length
      const returnValue = index === 'all' ? requests : (requests[parseInt(index, 10) - 1] || null)

      log && cy.state('current') === this && log.set({
        aliasType: 'intercept',
        consoleProps: () => {
          return {
            Alias: selector,
            Yielded: returnValue,
          }
        },
      })

      return returnValue
    }

    // If we've fallen through to here, then this is a subject alias - the result of one or more previous
    // cypress commands. We replay their subject chain (including possibly re-quering the DOM)
    // and use this as the result of the alias.

    // If we have a test similar to
    // cy.get('li').as('alias').then(li => li.remove())
    // cy.get('@alias').should('not.exist')

    // then Cypress can be very confused: the original 'get' command was not followed by 'should not exist'
    // but when reinvoked, it is! We therefore set a special piece of state,
    // which the 'should exist' assertion can read to determine if the *current* command is followed by a 'should not
    // exist' assertion.
    cy.state('aliasCurrentCommand', this)
    const subject = cy.getSubjectFromChain(aliasObj.subjectChain)

    cy.state('aliasCurrentCommand', undefined)

    if ($dom.isElement(subject)) {
      log && cy.state('current') === this && log.set({
        aliasType: 'dom',
        consoleProps: () => {
          return {
            Alias: selector,
            Yielded: $dom.getElements(subject),
            Elements: (subject as JQuery<HTMLElement>).length,
          }
        },
      })
    } else {
      log && cy.state('current') === this && log.set({
        aliasType: 'primitive',
        consoleProps: () => {
          return {
            Alias: selector,
            Yielded: subject,
          }
        },
      })
    }

    return subject
  }
}

export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('get', function get (selector, userOptions: GetOptions = {}) {
    if ((userOptions === null) || _.isArray(userOptions) || !_.isPlainObject(userOptions)) {
      $errUtils.throwErrByPath('get.invalid_options', {
        args: { options: userOptions },
      })
    }

    const log = userOptions.log !== false && (userOptions._log || Cypress.log({
      message: selector,
      type: 'parent',
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    }))

    this.set('timeout', userOptions.timeout)
    this.set('_log', log)

    if (aliasRe.test(selector)) {
      return getAlias.call(this, selector, log, cy)
    }

    const withinSubject = cy.state('withinSubjectChain')

    const includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)

    return () => {
      Cypress.ensure.commandCanCommunicateWithAUT(cy)

      let $el

      try {
        let scope = userOptions.withinSubject !== undefined ? userOptions.withinSubject : cy.getSubjectFromChain(withinSubject)

        if (includeShadowDom) {
          const root = scope?.get(0) || cy.state('document')
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
        if (err.message.startsWith('Syntax error')) {
          err.retry = false
        }

        // this is usually a sizzle error (invalid selector)
        if (log) {
          err.onFail = () => log.error(err)
        }

        throw err
      }

      log && cy.state('current') === this && log.set({
        $el,
        consoleProps: () => {
          return {
            Selector: selector,
            Yielded: $dom.getElements($el),
            Elements: $el.length,
          }
        },
      })

      return $el
    }
  })
}
