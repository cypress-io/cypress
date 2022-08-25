import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import { resolveShadowDomInclusion } from '../../../cypress/shadow_dom_utils'
import { getAliasedRequests, isDynamicAliasingPossible } from '../../net-stubbing/aliasing'
import { aliasRe, aliasIndexRe } from '../../aliases'

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
      toSelect = selector.replace(/\\.[0-9all]$/, '')
    }

    let aliasObj

    try {
      aliasObj = cy.getAlias(toSelect)
    } catch (err) {
      // possibly this is a dynamic alias, check to see if there is a request
      const requests = getAliasedRequests(alias, cy.state)

      if (!isDynamicAliasingPossible(cy.state) || !requests.length) {
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

    log && log.set('referencesAlias', { name: alias })

    /*
     * There are three cases for aliases, each explained in more detail below:
     * 1. Route aliases
     * 2. Intercept aliases
     * 3. Subject aliases (either DOM elements or primitives).
     */

    if (command.get('name') === 'route') {
      // In the case of a route alias, getRequestsByAlias handles selecting the proper index
      // and returns one or more requests.
      const requests = cy.getRequestsByAlias(alias) || null

      log && log.set({
        aliasType: 'route',
        consoleProps: () => {
          return {
            Alias: selector,
            Yielded: requests,
          }
        },
      })

      return requests
    }

    if (command.get('name') === 'intercept') {
      // Intercept aliases are fairly similar, but `getAliasedRequests` does *not* handle indexes
      // and we have to do it ourselves here.

      // Posible TODO: Unify this index identifying and selecting logic with that from `getRequestsByAlias`
      const requests = getAliasedRequests(aliasObj.alias, cy.state)

      // If the user provides an index ("@foo.1" or "@foo.all"), use that. Otherwise, return the most recent request.
      const match = selector.match(aliasIndexRe)
      const index = match ? match[1] : (requests.length - 1)

      const returnValue = index === 'all' ? requests : (requests[parseInt(index, 10)] || null)

      log && log.set({
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
    const subject = $utils.getSubjectFromChain(aliasObj.subjectChain, cy)

    cy.state('aliasCurrentCommand', undefined)

    if ($dom.isElement(subject)) {
      log && log.set({
        aliasType: 'dom',
        consoleProps: () => {
          return {
            Alias: selector,
            Yielded: $dom.getElements(subject),
            Elements: subject.length,
          }
        },
      })
    } else {
      log && log.set({
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
  Commands.addSelector('get', null, function get (selector, userOptions: Partial<Cypress.Loggable & Cypress.Withinable & Cypress.Shadow> = {}) {
    if ((userOptions === null) || _.isArray(userOptions) || !_.isPlainObject(userOptions)) {
      $errUtils.throwErrByPath('get.invalid_options', {
        args: { options: userOptions },
      })
    }

    const log = userOptions.log !== false && Cypress.log({
      message: selector,
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    })

    cy.state('current').set('timeout', userOptions.timeout)

    if (aliasRe.test(selector)) {
      return getAlias.call(this, selector, log, cy)
    }

    const withinSubject = cy.state('withinSubject')
    const includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)

    return () => {
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

      log && log.set({
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

  Commands.add('shadow', { prevSubject: 'element' }, (subject, options) => {
    const userOptions = options || {}

    options = _.defaults({}, userOptions, { log: true })

    const consoleProps: Record<string, any> = {
      'Applied To': $dom.getElements(subject),
    }

    if (options.log !== false) {
      options._log = Cypress.log({
        timeout: options.timeout,
        consoleProps () {
          return consoleProps
        },
      })
    }

    const setEl = ($el) => {
      if (options.log === false) {
        return
      }

      consoleProps.Yielded = $dom.getElements($el)
      consoleProps.Elements = $el?.length

      return options._log.set({ $el })
    }

    const getShadowRoots = () => {
      // find all shadow roots of the subject(s), if any exist
      const $el = subject
      .map((i, node) => node.shadowRoot)
      .filter((i, node) => node !== undefined && node !== null)

      setEl($el)

      return cy.verifyUpcomingAssertions($el, options, {
        onRetry: getShadowRoots,
        onFail (err) {
          if (err.type !== 'existence') {
            return
          }

          const { message, docsUrl } = $errUtils.cypressErrByPath('shadow.no_shadow_root')

          err.message = message
          err.docsUrl = docsUrl
        },
      })
    }

    return getShadowRoots()
  })
}
