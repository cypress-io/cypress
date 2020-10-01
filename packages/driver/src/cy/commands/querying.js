const _ = require('lodash')
const Promise = require('bluebird')

const $dom = require('../../dom')
const $elements = require('../../dom/elements')
const $errUtils = require('../../cypress/error_utils')
const { resolveShadowDomInclusion } = require('../../cypress/shadow_dom_utils')

module.exports = (Commands, Cypress, cy, state) => {
  Commands.addAll({
    focused (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
        verify: true,
        log: true,
      })

      if (options.log) {
        options._log = Cypress.log({ timeout: options.timeout })
      }

      const log = ($el) => {
        if (options.log === false) {
          return
        }

        options._log.set({
          $el,
          consoleProps () {
            const ret = $el ? $dom.getElements($el) : '--nothing--'

            return {
              Yielded: ret,
              Elements: $el != null ? $el.length : 0,
            }
          },
        })
      }

      const getFocused = () => {
        const focused = cy.getFocused()

        log(focused)

        return focused
      }

      const resolveFocused = () => {
        return Promise
        .try(getFocused)
        .then(($el) => {
          if (options.verify === false) {
            return $el
          }

          if (!$el) {
            $el = $dom.wrap(null)
            $el.selector = 'focused'
          }

          // pass in a null jquery object for assertions
          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveFocused,
          })
        })
      }

      return resolveFocused()
    },

    get (selector, options = {}) {
      const userOptions = options
      const ctx = this

      if ((userOptions === null) || _.isArray(userOptions) || !_.isPlainObject(userOptions)) {
        return $errUtils.throwErrByPath('get.invalid_options', {
          args: { options: userOptions },
        })
      }

      options = _.defaults({}, userOptions, {
        retry: true,
        withinSubject: state('withinSubject'),
        log: true,
        command: null,
        verify: true,
      })

      options.includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)

      let aliasObj
      const consoleProps = {}
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

        const obj = {}

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

        options._log.set(obj)
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

      aliasObj = cy.getAlias(toSelect)
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
              subject = subject.filter((index, el) => $dom.isAttached(el))

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

        options._log.set({ $el })
      }

      const getElements = () => {
        let $el

        try {
          let scope = options.withinSubject

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
        } catch (err) {
          // this is usually a sizzle error (invalid selector)
          err.onFail = () => {
            if (options.log === false) {
              return err
            }

            options._log.error(err)
          }

          throw err
        }

        // if that didnt find anything and we have a within subject
        // and we have been explictly told to filter
        // then just attempt to filter out elements from our within subject
        if (!$el.length && options.withinSubject && options.filter) {
          const filtered = options.withinSubject.filter(selector)

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

      return resolveElements()
    },

    root (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log !== false) {
        options._log = Cypress.log({
          message: '',
          timeout: options.timeout,
        })
      }

      const log = ($el) => {
        if (options.log) {
          options._log.set({ $el })
        }

        return $el
      }

      const withinSubject = state('withinSubject')

      if (withinSubject) {
        return log(withinSubject)
      }

      return cy.now('get', 'html', { log: false }).then(log)
    },
  })

  Commands.addAll({ prevSubject: ['optional', 'window', 'document', 'element'] }, {
    contains (subject, filter, text, options = {}) {
      let userOptions = options

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

      if (userOptions.matchCase === true && _.isRegExp(text) && text.flags.includes('i')) {
        $errUtils.throwErrByPath('contains.regex_conflict')
      }

      options = _.defaults({}, userOptions, { log: true, matchCase: true })

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

        options._log.set({ $el })
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
            },
          })
        })
      }

      return Promise
      .try(resolveElements)
    },
  })

  Commands.addAll({ prevSubject: ['element', 'document'] }, {
    within (subject, options, fn) {
      let userOptions = options
      const ctx = this

      if (_.isUndefined(fn)) {
        fn = userOptions
        userOptions = {}
      }

      options = _.defaults({}, userOptions, { log: true })

      if (options.log) {
        options._log = Cypress.log({
          $el: subject,
          message: '',
          timeout: options.timeout,
        })
      }

      if (!_.isFunction(fn)) {
        $errUtils.throwErrByPath('within.invalid_argument', { onFail: options._log })
      }

      // reference the next command after this
      // within.  when that command runs we'll
      // know to remove withinSubject
      const next = state('current').get('next')

      // backup the current withinSubject
      // this prevents a bug where we null out
      // withinSubject when there are nested .withins()
      // we want the inner within to restore the outer
      // once its done
      const prevWithinSubject = state('withinSubject')

      state('withinSubject', subject)

      // https://github.com/cypress-io/cypress/pull/8699
      // An internal command is inserted to create a divider between
      // commands inside within() callback and commands chained to it.
      const restoreCmdIndex = state('index') + 1

      cy.queue.splice(restoreCmdIndex, 0, {
        args: [subject],
        name: 'within-restore',
        fn: (subject) => subject,
      })

      state('index', restoreCmdIndex)

      fn.call(ctx, subject)

      const cleanup = () => cy.removeListener('command:start', setWithinSubject)

      // we need a mechanism to know when we should remove
      // our withinSubject so we dont accidentally keep it
      // around after the within callback is done executing
      // so when each command starts, check to see if this
      // is the command which references our 'next' and
      // if so, remove the within subject
      const setWithinSubject = (obj) => {
        if (obj !== next) {
          return
        }

        // okay so what we're doing here is creating a property
        // which stores the 'next' command which will reset the
        // withinSubject.  If two 'within' commands reference the
        // exact same 'next' command, then this prevents accidentally
        // resetting withinSubject more than once.  If they point
        // to differnet 'next's then its okay
        if (next !== state('nextWithinSubject')) {
          state('withinSubject', prevWithinSubject || null)
          state('nextWithinSubject', next)
        }

        // regardless nuke this listeners
        cleanup()
      }

      // if next is defined then we know we'll eventually
      // unbind these listeners
      if (next) {
        cy.on('command:start', setWithinSubject)
      } else {
        // remove our listener if we happen to reach the end
        // event which will finalize cleanup if there was no next obj
        cy.once('command:queue:before:end', () => {
          cleanup()

          state('withinSubject', null)
        })
      }

      return subject
    },
  })

  Commands.add('shadow', { prevSubject: 'element' }, (subject, options) => {
    const userOptions = options || {}

    options = _.defaults({}, userOptions, { log: true })

    const consoleProps = {
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
