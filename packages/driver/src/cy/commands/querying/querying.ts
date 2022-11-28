import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import $errUtils from '../../../cypress/error_utils'
import type { Log } from '../../../cypress/log'
import { resolveShadowDomInclusion } from '../../../cypress/shadow_dom_utils'
import { getAliasedRequests, isDynamicAliasingPossible } from '../../net-stubbing/aliasing'

interface InternalGetOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow> {
  _log?: Log
  _retries?: number
  filter?: any
  onRetry?: Function
  verify?: boolean
}

interface InternalContainsOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.CaseMatchable & Cypress.Shadow> {
  _log?: Log
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    get (selector, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow> = {}) {
      const ctx = this

      if ((userOptions === null) || _.isArray(userOptions) || !_.isPlainObject(userOptions)) {
        return $errUtils.throwErrByPath('get.invalid_options', {
          args: { options: userOptions },
        })
      }

      const options: InternalGetOptions = _.defaults({}, userOptions, {
        retry: true,
        withinSubject: state('withinSubject'),
        log: true,
        command: null,
        verify: true,
      })

      options.includeShadowDom = resolveShadowDomInclusion(Cypress, options.includeShadowDom)

      let aliasObj
      const consoleProps: Record<string, any> = {}
      const start = (aliasType) => {
        if (options.log === false) {
          return
        }

        if (options._log == null) {
          options._log = Cypress.log({
            message: selector,
            referencesAlias: (aliasObj != null && aliasObj.alias) ? { name: aliasObj.alias } : undefined,
            aliasType,
            timeout: options.timeout,
            consoleProps: () => {
              return consoleProps
            },
          })
        }
      }

      const log = (value, aliasType = 'dom') => {
        if (options.log === false) {
          return
        }

        if (!_.isObject(options._log)) {
          start(aliasType)
        }

        const obj: any = {}

        if (aliasType === 'dom') {
          _.extend(obj, {
            $el: value,
            numRetries: options._retries,
          })
        }

        obj.consoleProps = () => {
          const key = aliasObj ? 'Alias' : 'Selector'

          consoleProps[key] = selector

          switch (aliasType) {
            case 'dom':
              _.extend(consoleProps, {
                Yielded: $dom.getElements(value),
                Elements: (value != null ? value.length : undefined),
              })

              break
            case 'primitive':
              _.extend(consoleProps, {
                Yielded: value,
              })

              break
            case 'route':
              _.extend(consoleProps, {
                Yielded: value,
              })

              break
            default:
              break
          }

          return consoleProps
        }

        options._log!.set(obj)
      }

      let allParts
      let toSelect

      // We want to strip everything after the last '.'
      // only when it is potentially a number or 'all'
      if ((_.indexOf(selector, '.') === -1) ||
        (_.keys(state('aliases')).includes(selector.slice(1)))) {
        toSelect = selector
      } else {
        allParts = _.split(selector, '.')
        toSelect = _.join(_.dropRight(allParts, 1), '.')
      }

      try {
        aliasObj = cy.getAlias(toSelect)
      } catch (err) {
        // possibly this is a dynamic alias, check to see if there is a request
        const alias = toSelect.slice(1)
        const [request] = getAliasedRequests(alias, state)

        if (!isDynamicAliasingPossible(state) || !request) {
          throw err
        }

        aliasObj = {
          alias,
          command: state('routes')[request.routeId].command,
        }
      }

      if (!aliasObj && isDynamicAliasingPossible(state)) {
        const requests = getAliasedRequests(toSelect, state)

        if (requests.length) {
          aliasObj = {
            alias: toSelect,
            command: state('routes')[requests[0].routeId].command,
          }
        }
      }

      if (aliasObj) {
        let { subject, alias, command } = aliasObj

        const resolveAlias = () => {
          // if this is a DOM element
          if ($dom.isElement(subject)) {
            let replayFrom = false

            const replay = () => {
              cy.replayCommandsFrom(command)

              // its important to return undefined
              // here else we trick cypress into thinking
              // we have a promise violation
              return undefined
            }

            // if we're missing any element
            // within our subject then filter out
            // anything not currently in the DOM
            if ($dom.isDetached(subject)) {
              subject = (subject as any).filter((index, el) => $dom.isAttached(el))

              // if we have nothing left
              // just go replay the commands
              if (!subject.length) {
                return replay()
              }
            }

            log(subject)

            return cy.verifyUpcomingAssertions(subject, options, {
              onFail (err) {
                // if we are failing because our aliased elements
                // are less than what is expected then we know we
                // need to requery for them and can thus replay
                // the commands leading up to the alias
                if ((err.type === 'length') && (err.actual < err.expected)) {
                  return replayFrom = true
                }

                return false
              },
              onRetry () {
                if (replayFrom) {
                  return replay()
                }

                return resolveAlias()
              },
            })
          }

          // if this is a route command
          if (command.get('name') === 'route') {
            if (!((_.indexOf(selector, '.') === -1) ||
              (_.keys(state('aliases')).includes(selector.slice(1))))
            ) {
              allParts = _.split(selector, '.')
              const index = _.last(allParts)

              alias = _.join([alias, index], '.')
            }

            const requests = cy.getRequestsByAlias(alias) || null

            log(requests, 'route')

            return requests
          }

          if (command.get('name') === 'intercept') {
            const requests = getAliasedRequests(alias, state)
            // detect alias.all and alias.index
            const specifier = /\.(all|[\d]+)$/.exec(selector)

            if (specifier) {
              const [, index] = specifier

              if (index === 'all') {
                return requests
              }

              return requests[Number(index)] || null
            }

            log(requests, command.get('name'))

            // by default return the latest match
            return _.last(requests) || null
          }

          // log as primitive
          log(subject, 'primitive')

          const verifyAssertions = () => {
            return cy.verifyUpcomingAssertions(subject, options, {
              ensureExistenceFor: false,
              onRetry: verifyAssertions,
            })
          }

          return verifyAssertions()
        }

        return resolveAlias()
      }

      start('dom')

      const setEl = ($el) => {
        if (options.log === false) {
          return
        }

        consoleProps.Yielded = $dom.getElements($el)
        consoleProps.Elements = $el != null ? $el.length : undefined

        options._log!.set({ $el })
      }

      const getElements = () => {
        let $el

        try {
          let scope: (typeof options.withinSubject) | Node[] = options.withinSubject

          if (options.includeShadowDom) {
            const root = options.withinSubject ? options.withinSubject[0] : cy.state('document')
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
          err.onFail = () => {
            if (options.log === false) {
              return err
            }

            options._log!.error(err)
          }

          throw err
        }

        // if that didnt find anything and we have a within subject
        // and we have been explictly told to filter
        // then just attempt to filter out elements from our within subject
        if (!$el.length && options.withinSubject && options.filter) {
          const filtered = (options.withinSubject as JQuery).filter(selector)

          // reset $el if this found anything
          if (filtered.length) {
            $el = filtered
          }
        }

        // store the $el now in case we fail
        setEl($el)

        // allow retry to be a function which we ensure
        // returns truthy before returning its
        if (_.isFunction(options.onRetry)) {
          const ret = options.onRetry.call(ctx, $el)

          if (ret) {
            log($el)

            return ret
          }
        } else {
          log($el)

          return $el
        }
      }

      const resolveElements = () => {
        return Promise.try(getElements).then(($el) => {
          if (options.verify === false) {
            return $el
          }

          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements,
          })
        })
      }

      return cy.retryIfCommandAUTOriginMismatch(resolveElements, options.timeout)
    },
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
                    const assertionLog = Cypress.state('current').getLastLog()

                    return $errUtils.throwErrByPath('contains.length_option', { onFail: assertionLog })
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
