import _, { isEmpty } from 'lodash'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import type { Log } from '../../../cypress/log'
import { resolveShadowDomInclusion } from '../../../cypress/shadow_dom_utils'
import { getAliasedRequests, isDynamicAliasingPossible } from '../../net-stubbing/aliasing'
import { aliasRe, aliasIndexRe, aliasDisplayName } from '../../aliases'

type GetOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow & {
  _log?: Log
}>

type ContainsOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.CaseMatchable & Cypress.Shadow>

type QueryCommandOptions = 'get' | 'contains' | 'shadow' | ''

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
      // We need to use the stripped alias
      const strippedAlias = aliasDisplayName(toSelect)
      const requests = getAliasedRequests(strippedAlias, cy.state)

      if (!isDynamicAliasingPossible(cy.state) || !requests.length) {
        err.retry = false
        throw err
      }

      aliasObj = {
        alias: strippedAlias,
        command: cy.state('routes')[requests[0].routeId].command,
      }
    }

    if (!aliasObj) {
      return
    }

    const { command } = aliasObj

    cy.state('current') === this && log?.set('referencesAlias', { name: alias })

    /*
     * There are two cases for aliases, each explained in more detail below:
     * 1. Intercept aliases
     * 2. Subject aliases (either DOM elements or primitives).
     */

    if (command.get('name') === 'intercept') {
      // `getAliasedRequests` does *not* handle indexes and we have to do it ourselves here.

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

      cy.state('current') === this && log?.set({
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

function validateTimeoutFromOpts (options: GetOptions | ContainsOptions | Cypress.LogTimeoutOptions = {}, queryCommand: QueryCommandOptions = '') {
  if (!isEmpty(queryCommand) && _.isPlainObject(options) && options.hasOwnProperty('timeout') && !_.isFinite(options.timeout)) {
    $errUtils.throwErrByPath(`${queryCommand}.invalid_option_timeout`, {
      args: { timeout: options.timeout },
    })
  }
}

export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('get', function get (selector, userOptions: GetOptions = {}) {
    if ((userOptions === null) || _.isArray(userOptions) || !_.isPlainObject(userOptions)) {
      $errUtils.throwErrByPath('get.invalid_options', {
        args: { options: userOptions },
      })
    }

    validateTimeoutFromOpts(userOptions, 'get')

    const log = userOptions._log || Cypress.log({
      message: selector,
      type: 'parent',
      hidden: userOptions.log === false,
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    })

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

      cy.state('current') === this && log?.set({
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

    validateTimeoutFromOpts(userOptions, 'contains')

    // find elements by the :cy-contains pseudo selector
    // and any submit inputs with the attributeContainsWord selector
    const selector = $dom.getContainsSelector(text, filter, { matchCase: true, ...userOptions })

    const log = Cypress.log({
      message: $utils.stringify(_.compact([filter, text])),
      type: this.hasPreviouslyLinkedCommand ? 'child' : 'parent',
      hidden: userOptions.log === false,
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    })

    const getOptions = _.extend({ _log: log }, userOptions) as GetOptions
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

  Commands.addQuery('shadow', function contains (userOptions: Cypress.LogTimeoutOptions) {
    userOptions = userOptions || {}
    const log = Cypress.log({
      hidden: userOptions.log === false,
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    })

    validateTimeoutFromOpts(userOptions, 'shadow')

    this.set('timeout', userOptions.timeout)
    this.set('onFail', (err) => {
      switch (err.type) {
        case 'existence': {
          const { message, docsUrl } = $errUtils.cypressErrByPath('shadow.no_shadow_root')

          err.message = message
          err.docsUrl = docsUrl
          break
        }
        default:
          break
      }
    })

    return (subject) => {
      Cypress.ensure.isType(subject, 'element', 'shadow', cy)

      // find all shadow roots of the subject(s), if any exist
      const $el = subject
      .map((i, node) => node.shadowRoot)
      .filter((i, node) => node !== undefined && node !== null)

      log && cy.state('current') === this && log.set({
        $el,
        consoleProps: () => {
          return {
            'Applied To': $dom.getElements(subject),
            Yielded: $dom.getElements($el),
            Elements: $el?.length,
          }
        },
      })

      return $el
    }
  })
}
