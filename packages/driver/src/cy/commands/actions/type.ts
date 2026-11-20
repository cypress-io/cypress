import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import $Keyboard from '../../../cy/keyboard'
import { isRemoteSubject } from '../../remote'
import { remoteClear, remoteType } from '../../remote/actions'
import { createTypeEventHandlers } from './type_events'

import debugFn from 'debug'
const debug = debugFn('cypress:driver:command:type')

export default function (Commands, Cypress, cy, state, config) {
  const { keyboard } = cy.devices

  function type (subject: any, chars: any, userOptions: Partial<InternalTypeOptions> = {}) {
    let updateTable

    // allow the el we're typing into to be
    // changed by options -- used by cy.clear()
    const options: InternalTypeOptions = _.defaults({}, userOptions, {
      $el: subject,
      log: true,
      verify: true,
      force: false,
      delay: config('keystrokeDelay') ?? $Keyboard.getConfig().keystrokeDelay ?? 0,
      release: true,
      parseSpecialCharSequences: true,
      waitForAnimations: config('waitForAnimations'),
      animationDistanceThreshold: config('animationDistanceThreshold'),
    })

    // if this instance is not present, create a log instance for cy.type()
    // cy.clear passes in their log instance
    if (!options._log) {
      // figure out the options which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options)

      const table = {}

      const getRow = (id, key, event) => {
        if (table[id]) {
          return table[id]
        }

        const modifiers = $Keyboard.modifiersToString(keyboard.getActiveModifiers(state))

        const formatEventDetails = (obj) => {
          return `{ ${(Object.keys(obj)
          .filter((v) => Boolean(obj[v]))
          .map((v) => `${v}: ${obj[v]}`))
          .join(', ')
          } }`
        }
        const obj = table[id] = {
          'Typed': key || null,
          'Target Element': event.target,
          'Events Fired': '',
          'Details': formatEventDetails({ code: event.code, which: event.which }),
          'Prevented Default': null,
          'Active Modifiers': modifiers || null,
        }

        return obj
      }

      updateTable = function (id, key, event, value) {
        const row = getRow(id, key, event)

        row['Events Fired'] += row['Events Fired'] ? `, ${event.type}` : event.type
        if (!value) {
          row['Prevented Default'] = true
        }
      }

      const getTableData = () => {
        return _.values(table)
      }

      options._log = Cypress.log({
        message: [chars, deltaOptions],
        $el: options.$el,
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          return {
            'Typed': chars,
            'Applied To': $dom.getElements(options.$el),
            'Options': deltaOptions,
            'table': {
              // mouse events tables will take up slot 1 if they're present
              // this preserves the order of the tables
              2: () => {
                return {
                  name: 'Keyboard Events',
                  data: getTableData(),
                }
              },
            },
          }
        },
      })

      options._log?.snapshot('before', { next: 'after' })
    }

    if (options.$el.length > 1) {
      $errUtils.throwErrByPath('type.multiple_elements', {
        onFail: options._log,
        args: { num: options.$el.length },
      })
    }

    if (!(_.isString(chars) || _.isFinite(chars))) {
      $errUtils.throwErrByPath('type.wrong_type', {
        onFail: options._log,
        args: { chars },
      })
    }

    if (_.isString(chars) && _.isEmpty(chars)) {
      $errUtils.throwErrByPath('type.empty_string', {
        onFail: options._log,
        args: { chars },
      })
    }

    const isInvalidDelay = (delay) => {
      return delay != null && (!_.isNumber(delay) || delay < 0)
    }

    if (isInvalidDelay(userOptions.delay)) {
      $errUtils.throwErrByPath('keyboard.invalid_delay', {
        onFail: options._log,
        args: {
          cmd: 'type',
          docsPath: 'type',
          option: 'delay',
          delay: userOptions.delay,
        },
      })
    }

    // specific error if test config keystrokeDelay is invalid
    if (isInvalidDelay(config('keystrokeDelay'))) {
      $errUtils.throwErrByPath('keyboard.invalid_per_test_delay', {
        onFail: options._log,
        args: { delay: config('keystrokeDelay') },
      })
    }

    chars = `${chars}`

    if (isRemoteSubject(options.$el)) {
      return remoteType(Cypress, cy, options.$el, chars, options)
    }

    const win = state('window')

    const type = function () {
      const handlers = createTypeEventHandlers({
        $el: options.$el,
        state,
        isBrowser: (name) => Cypress.isBrowser(name),
        submit: (form) => cy.now('submit', form, { log: false, $el: form }),
        updateTable,
      })

      return keyboard.type({
        $el: options.$el,
        chars,
        delay: options.delay,
        release: options.release,
        parseSpecialCharSequences: options.parseSpecialCharSequences,
        window: win,
        force: options.force,
        onFail: options._log,

        updateValue: handlers.updateValue,

        onAfterType () {
          if (options.release === true) {
            state('keyboardModifiers', null)
          }
        },

        onBeforeType (totalKeys) {
          // for the total number of keys we're about to
          // type, ensure we raise the timeout to account
          // for the delay being added to each keystroke
          if (options.delay) {
            return cy.timeout(totalKeys * options.delay, true, 'type')
          }
        },

        onEvent: handlers.onEvent,
        onValueChange: handlers.onValueChange,
        onEnterPressed: handlers.onEnterPressed,

        onNoMatchingSpecialChars (chars, allChars) {
          if (chars === 'tab') {
            $errUtils.throwErrByPath('type.tab', { onFail: options._log })
          }

          $errUtils.throwErrByPath('type.invalid', {
            onFail: options._log,
            args: { chars: `{${chars}}`, allChars },
          })
        },
      })
    }

    const subjectChain = cy.subjectChain()

    const handleFocused = function () {
      // if it's the body, don't need to worry about focus
      // (unless it can be modified i.e we're in designMode or contenteditable)
      const isBody = options.$el.is('body') && !$elements.isContentEditable(options.$el[0])

      if (isBody) {
        debug('typing into body')

        return type()
      }

      options.ensure = {
        position: true,
        visibility: true,
        notDisabled: true,
        notAnimating: true,
        notCovered: true,
        notReadonly: true,
      }

      // if the subject is already the focused element, start typing
      // we handle contenteditable children by getting the host contenteditable,
      // and seeing if that is focused
      // Checking first if element is focusable accounts for focusable els inside
      // of contenteditables
      if ($elements.isFocusedOrInFocused(options.$el.get(0))) {
        debug('element is already focused, only checking readOnly property')
        options.ensure = {
          notReadonly: true,
        }
      }

      return $actionability.verify(cy, options.$el, config, options, {
        subjectFn: () => cy.getSubjectFromChain(subjectChain),

        onScroll ($el, type) {
          return Cypress.action('cy:scrolled', $el, type)
        },

        onReady ($elToClick) {
          // if we dont have a focused element
          // or if we do and its not ourselves
          // then issue the click
          if ($elements.isFocusedOrInFocused($elToClick[0])) {
            return type()
          }

          // click the element first to simulate focus
          // and typical user behavior in case the window
          // is out of focus
          // cannot just call .focus, since children of contenteditable will not receive cursor
          // with .focus()
          return cy.now('click', $elToClick, {
            log: false,
            verify: false,
            _log: options._log,
            force: true, // force the click, avoid waiting
            timeout: options.timeout,
            interval: options.interval,
            errorOnSelect: false,
            scrollBehavior: options.scrollBehavior,
            subjectFn: () => $elToClick,
          })
          .then(() => {
            const activeElement = $elements.getActiveElByDocument($elToClick)

            if (!options.force && activeElement === null) {
              const node = $dom.stringify($elToClick)
              const onFail = options._log

              if ($dom.isTextLike($elToClick[0])) {
                $errUtils.throwErrByPath('type.not_actionable_textlike', {
                  onFail,
                  args: { node },
                })
              }

              $errUtils.throwErrByPath('type.not_on_typeable_element', {
                onFail,
                args: { node },
              })
            }

            return type()
          })
        },
      })
    }

    return handleFocused()
    .then(() => {
      cy.timeout($actionability.delay, true, 'type')

      return Promise
      .delay($actionability.delay, 'type')
      .then(() => {
        // command which consume cy.type may
        // want to handle verification themselves

        if (options.verify === false) {
          return options.$el
        }

        const verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions,
          })
        }

        return verifyAssertions()
      })
    })
  }

  function clear (subject, userOptions: Partial<InternalClearOptions> = {}) {
    const options: InternalClearOptions = _.defaults({}, userOptions, {
      log: true,
      force: false,
      waitForAnimations: config('waitForAnimations'),
      animationDistanceThreshold: config('animationDistanceThreshold'),
    })

    if (isRemoteSubject(subject)) {
      return remoteClear(Cypress, cy, subject, options)
    }

    // blow up if any member of the subject
    // isnt a textarea or text-like
    const clear = function (el) {
      const $el = $dom.wrap(el)

      // figure out the options which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options)

      options._log = Cypress.log({
        message: deltaOptions,
        $el,
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          return {
            'Applied To': $dom.getElements($el),
            'Elements': $el.length,
            'Options': deltaOptions,
          }
        },
      })

      const callTypeCmd = ($el) => {
        return cy.now('type', $el, '{selectall}{del}', {
          $el,
          log: false,
          verify: false, // handle verification ourselves
          _log: options._log,
          force: options.force,
          timeout: options.timeout,
          interval: options.interval,
          waitForAnimations: options.waitForAnimations,
          animationDistanceThreshold: options.animationDistanceThreshold,
          scrollBehavior: options.scrollBehavior,
        }).then(() => {
          if (options._log) {
            options._log.snapshot().end()
          }

          return null
        })
      }

      const throwError = ($el) => {
        const node = $dom.stringify($el)
        const word = $utils.plural(subject, 'contains', 'is')

        $errUtils.throwErrByPath('clear.invalid_element', {
          onFail: options._log,
          args: { word, node },
        })
      }

      if (!$dom.isTextLike($el.get(0))) {
        options.ensure = {
          position: true,
          visibility: true,
          notDisabled: true,
          notAnimating: true,
          notCovered: true,
          notReadonly: true,
        }

        return $actionability.verify(cy, $el, config, options, {
          onScroll ($el, type) {
            return Cypress.action('cy:scrolled', $el, type)
          },

          onReady ($elToClick) {
            const activeElement = $elements.getActiveElByDocument($elToClick)

            if (!options.force && activeElement === null || !$dom.isTextLike($elToClick.get(0))) {
              throwError($el)
            }

            return callTypeCmd($elToClick)
          },
        })
      }

      return callTypeCmd($el)
    }

    return Promise
    .resolve(subject.toArray())
    .each(clear)
    .then(() => {
      const verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(subject, options, {
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    })
  }

  return Commands.addAll(
    { prevSubject: 'element' },
    {
      type,
      clear,
    },
  )
}
