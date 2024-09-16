import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import $selection from '../../../dom/selection'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import $Keyboard from '../../../cy/keyboard'
import type { Log } from '../../../cypress/log'

import debugFn from 'debug'
const debug = debugFn('cypress:driver:command:type')

interface InternalTypeOptions extends Partial<Cypress.TypeOptions> {
  _log?: Log
  $el: JQuery
  ensure?: object
  verify: boolean
  interval?: number
}

interface InternalClearOptions extends Partial<Cypress.ClearOptions> {
  _log?: Log
  ensure?: object
}

export default function (Commands, Cypress, cy, state, config) {
  const { keyboard } = cy.devices

  function type (subject, chars, userOptions: Partial<Cypress.TypeOptions> = {}) {
    let updateTable

    // allow the el we're typing into to be
    // changed by options -- used by cy.clear()
    const options: InternalTypeOptions = _.defaults({}, userOptions, {
      $el: subject,
      log: true,
      verify: true,
      force: false,
      delay: config('keystrokeDelay') || $Keyboard.getConfig().keystrokeDelay,
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
      return delay !== undefined && (!_.isNumber(delay) || delay < 0)
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

    const win = state('window')

    const getDefaultButtons = (form) => {
      const formId = CSS.escape(form.attr('id'))
      const nestedButtons = form.find('input, button')

      const possibleDefaultButtons: JQuery<any> = formId ? $dom.wrap(_.uniq([
        ...nestedButtons,
        ...$dom.query('body', form.prop('ownerDocument')).find(`input[form="${formId}"], button[form="${formId}"]`),
      ])) : nestedButtons

      return possibleDefaultButtons.filter((__, el) => {
        const $el = $dom.wrap(el)

        return (
          ($dom.isSelector($el, 'input') && $dom.isInputType($el, 'submit')) ||
          ($dom.isSelector($el, 'button') && !$dom.isInputType($el, 'button') && !$dom.isInputType($el, 'reset'))
        )
      })
    }

    const type = function () {
      const isFirefoxBefore91 = Cypress.isBrowser('firefox') && Cypress.browserMajorVersion() < 91
      const isFirefoxBefore98 = Cypress.isBrowser('firefox') && Cypress.browserMajorVersion() < 98
      const isFirefox106OrLater = Cypress.isBrowser('firefox') && Cypress.browserMajorVersion() >= 106
      const isFirefox129OrLater = Cypress.isBrowser('firefox') && Cypress.browserMajorVersion() >= 129

      const simulateSubmitHandler = function () {
        const form = options.$el.parents('form')

        if (!form.length) {
          return
        }

        const multipleInputsAllowImplicitSubmissionAndNoSubmitElements = function (form) {
          const submits = getDefaultButtons(form)

          // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
          // some types of inputs can submit the form when hitting {enter}
          // but only if they are the sole input that allows implicit submission
          // and there are no buttons or input[submits] in the form
          const implicitSubmissionInputs = form.find('input').filter((__, input) => {
            const $input = $dom.wrap(input)

            return $elements.isInputAllowingImplicitFormSubmission($input)
          })

          return (implicitSubmissionInputs.length > 1) && (submits.length === 0)
        }

        // throw an error here if there are multiple form parents

        // bail if we have multiple inputs allowing implicit submission and no submit elements
        if (multipleInputsAllowImplicitSubmissionAndNoSubmitElements(form)) {
          return
        }

        const clickedDefaultButton = function (button) {
          // find the 'default button' as per HTML spec and click it natively
          // do not issue mousedown / mouseup since this is supposed to be synthentic
          if (button.length) {
            button.get(0).click()

            return true
          }

          return false
        }

        const getDefaultButton = (form) => {
          return getDefaultButtons(form).first()
        }

        const defaultButtonisDisabled = (button) => {
          return button.prop('disabled')
        }

        const defaultButton = getDefaultButton(form)

        // bail if the default button is in a 'disabled' state
        if (defaultButtonisDisabled(defaultButton)) {
          return
        }

        // Before Firefox 98, submit event is automatically fired
        // when we send {Enter} KeyboardEvent to the input fields.
        // Because of that, we don't have to click the submit buttons.
        // Otherwise, we trigger submit events twice.
        //
        // WebKit will send the submit with an Enter keypress event,
        // so we do need to click the default button in this case.
        if (!isFirefoxBefore98 && !Cypress.isBrowser('webkit')) {
          // issue the click event to the 'default button' of the form
          // we need this to be synchronous so not going through our
          // own click command
          // as of now, at least in Chrome, causing the click event
          // on the button will indeed trigger the form submit event
          // so we dont need to fire it manually anymore!
          if (!clickedDefaultButton(defaultButton)) {
            // if we weren't able to click the default button
            // then synchronously fire the submit event
            // currently this is sync but if we use a waterfall
            // promise in the submit command it will break again
            // consider changing type to a Promise and juggle logging
            return cy.now('submit', form, { log: false, $el: form })
          }
        }
      }

      const dispatchChangeEvent = function (el, id) {
        const change = document.createEvent('HTMLEvents')

        change.initEvent('change', true, false)

        const dispatched = el.dispatchEvent(change)

        if (id && updateTable) {
          return updateTable(id, null, 'change', null, dispatched)
        }
      }

      const needSingleValueChange = (el) => {
        return $elements.isNeedSingleValueChangeInputElement(el)
      }

      // see comment in updateValue below
      let typed = ''

      const isContentEditable = $elements.isContentEditable(options.$el.get(0))
      const isTextarea = $elements.isTextarea(options.$el.get(0))

      const fireClickEvent = (el) => {
        const ctor = $dom.getDocumentFromElement(el).defaultView!.PointerEvent
        const event = new ctor('click', { composed: true })

        el.dispatchEvent(event)
      }

      let keydownEvents: any[] = []

      return keyboard.type({
        $el: options.$el,
        chars,
        delay: options.delay,
        release: options.release,
        parseSpecialCharSequences: options.parseSpecialCharSequences,
        window: win,
        force: options.force,
        onFail: options._log,

        updateValue (el, key, charsToType) {
          // in these cases, the value must only be set after all
          // the characters are input because attemping to set
          // a partial/invalid value results in the value being
          // set to an empty string
          if (needSingleValueChange(el)) {
            typed += key
            if (typed === charsToType) {
              return $elements.setNativeProp(el, 'value', charsToType)
            }
          }

          return $selection.replaceSelectionContents(el, key)
        },

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

        onEvent (id, key, event, value) {
          if (updateTable) {
            updateTable(id, key, event, value)
          }

          if (event.type === 'keydown') {
            keydownEvents.push(event.target)
          }

          if (
            (
              // Before Firefox 91, it sends a click event automatically on the
              // 'keyup' event for a Space key and we don't want to send it twice
              !Cypress.isBrowser('firefox') ||
              // Starting with Firefox 91, click events are no longer sent
              // automatically for <button> elements
              // event.target is null when the element is within the shadow DOM
              (!isFirefoxBefore91 && event.target && $elements.isButton(event.target)) ||
              // Starting with Firefox 98, click events are no longer sent
              // automatically for <input> elements
              // event.target is null when the element is within the shadow DOM
              (!isFirefoxBefore98 && event.target && $elements.isInput(event.target))
            ) &&
            // Click event is sent after keyup event with space key.
            event.type === 'keyup' && event.code === 'Space' &&
            // When event is prevented, the click event should not be emitted
            !event.defaultPrevented &&
            // Click events should be only sent to button-like elements.
            // event.target is null when used with shadow DOM.
            (event.target && $elements.isButtonLike(event.target)) &&
            // When a space key is pressed for input radio elements, the click event is only fired when it's not checked.
            !(event.target.tagName === 'INPUT' && event.target.type === 'radio' && event.target.checked === true) &&
            // When a space key is pressed on another element, the click event should not be fired.
            keydownEvents.includes(event.target)
          ) {
            fireClickEvent(event.target)

            keydownEvents = []

            // After Firefox 98 and before 129
            // Firefox doesn't update checkbox automatically even if the click event is sent.
            if (Cypress.isBrowser('firefox') && !isFirefox129OrLater) {
              if (event.target.type === 'checkbox') {
                event.target.checked = !event.target.checked
              } else if (event.target.type === 'radio') { // when checked is false, here cannot be reached because of the above condition
                event.target.checked = true
              }
            }
          }
        },

        // fires only when the 'value'
        // of input/text/contenteditable
        // changes
        onValueChange (originalText, el) {
          debug('onValueChange', originalText, el)
          // contenteditable should never be called here.
          // only inputs and textareas can have change events
          let changeEvent = state('changeEvent')

          if (changeEvent) {
            if (!changeEvent(null, true)) {
              state('changeEvent', null)
            }

            return
          }

          return state('changeEvent', (id, readOnly) => {
            const changed =
              $elements.getNativeProp(el, 'value') !== originalText

            if (!readOnly) {
              if (changed) {
                dispatchChangeEvent(el, id)
              }

              state('changeEvent', null)
            }

            return changed
          })
        },

        onEnterPressed (el) {
          // dont dispatch change events or handle
          // submit event if we've pressed enter into
          // a textarea or contenteditable
          if (isTextarea || isContentEditable) {
            return
          }

          // click event is only fired on button, image, submit, reset elements.
          // That's why we cannot use $elements.isButtonLike() here.
          const type = (type) => $elements.isInputType(el, type)
          const sendClickEvent = type('button') || type('image') || type('submit') || type('reset')

          // https://github.com/cypress-io/cypress/issues/19541
          // Send click event on type('{enter}')
          if (sendClickEvent) {
            if (
              // Before Firefox 98, it sends a click event automatically on
              // simulated keypress events and we don't want to send it twice
              !Cypress.isBrowser('firefox') ||
              // Starting with Firefox 98, click events are no longer sent
              // automatically for <input> elements, but are still sent for
              // other element types
              (!isFirefoxBefore98 && $elements.isInput(el)) ||
              // Starting with Firefox 106, click events are no longer sent
              // automatically for <button> elements
              (isFirefox106OrLater && $elements.isButton(el))
            ) {
              fireClickEvent(el)
            }
          }

          // if our value has changed since our
          // element was activated we need to
          // fire a change event immediately
          const changeEvent = state('changeEvent')

          if (changeEvent) {
            changeEvent()
          }

          // handle submit event handler here
          return simulateSubmitHandler()
        },

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
            let activeElement = $elements.getActiveElByDocument($elToClick)

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

  function clear (subject, userOptions: Partial<Cypress.ClearOptions> = {}) {
    const options: InternalClearOptions = _.defaults({}, userOptions, {
      log: true,
      force: false,
      waitForAnimations: config('waitForAnimations'),
      animationDistanceThreshold: config('animationDistanceThreshold'),
    })

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
            let activeElement = $elements.getActiveElByDocument($elToClick)

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
