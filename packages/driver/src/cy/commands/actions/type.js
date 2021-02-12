const _ = require('lodash')
const Promise = require('bluebird')

const $dom = require('../../../dom')
const $elements = require('../../../dom/elements')
const $selection = require('../../../dom/selection')
const $utils = require('../../../cypress/utils')
const $errUtils = require('../../../cypress/error_utils')
const $actionability = require('../../actionability')
const $Keyboard = require('../../../cy/keyboard')
const debug = require('debug')('cypress:driver:command:type')

module.exports = function (Commands, Cypress, cy, state, config) {
  const { keyboard } = cy.devices

  function type (subject, chars, options = {}) {
    const userOptions = options
    let updateTable

    // allow the el we're typing into to be
    // changed by options -- used by cy.clear()
    options = _.defaults({}, userOptions, {
      $el: subject,
      log: true,
      verify: true,
      force: false,
      delay: 10,
      release: true,
      parseSpecialCharSequences: true,
      waitForAnimations: config('waitForAnimations'),
      animationDistanceThreshold: config('animationDistanceThreshold'),
      scrollBehavior: config('scrollBehavior'),
    })

    if (options.log) {
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

      // transform table object into object with zero based index as keys
      const getTableData = () => {
        return _.reduce(_.values(table), (memo, value, index) => {
          memo[index + 1] = value

          return memo
        }
        , {})
      }

      options._log = Cypress.log({
        message: [chars, deltaOptions],
        $el: options.$el,
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

      options._log.snapshot('before', { next: 'after' })
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

    chars = `${chars}`

    const win = state('window')

    const getDefaultButtons = (form) => {
      return form.find('input, button').filter((__, el) => {
        const $el = $dom.wrap(el)

        return (
          ($dom.isSelector($el, 'input') && $dom.isInputType($el, 'submit')) ||
          ($dom.isSelector($el, 'button') && !$dom.isInputType($el, 'button') && !$dom.isInputType($el, 'reset'))
        )
      })
    }

    const type = function () {
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

        // In Firefox, submit event is automatically fired
        // when we send {Enter} KeyboardEvent to the input fields.
        // Because of that, we don't have to click the submit buttons.
        // Otherwise, we trigger submit events twice.
        if (!Cypress.isBrowser('firefox')) {
          // issue the click event to the 'default button' of the form
          // we need this to be synchronous so not going through our
          // own click command
          // as of now, at least in Chrome, causing the click event
          // on the button will indeed trigger the form submit event
          // so we dont need to fire it manually anymore!
          if (!clickedDefaultButton(defaultButton)) {
            // if we werent able to click the default button
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
          return cy.timeout(totalKeys * options.delay, true, 'type')
        },

        onEvent: updateTable || _.noop,

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

        onEnterPressed (id) {
          // dont dispatch change events or handle
          // submit event if we've pressed enter into
          // a textarea or contenteditable

          if (isTextarea || isContentEditable) {
            return
          }

          // if our value has changed since our
          // element was activated we need to
          // fire a change event immediately
          const changeEvent = state('changeEvent')

          if (changeEvent) {
            changeEvent(id)
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

      return $actionability.verify(cy, options.$el, options, {
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
            $el: $elToClick,
            log: false,
            verify: false,
            _log: options._log,
            force: true, // force the click, avoid waiting
            timeout: options.timeout,
            interval: options.interval,
            errorOnSelect: false,
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

  function clear (subject, options = {}) {
    const userOptions = options

    options = _.defaults({}, userOptions, {
      log: true,
      force: false,
      waitForAnimations: config('waitForAnimations'),
      animationDistanceThreshold: config('animationDistanceThreshold'),
      scrollBehavior: config('scrollBehavior'),
    })

    // blow up if any member of the subject
    // isnt a textarea or text-like
    const clear = function (el) {
      const $el = $dom.wrap(el)

      if (options.log) {
        // figure out the options which actually change the behavior of clicks
        const deltaOptions = $utils.filterOutOptions(options)

        options._log = Cypress.log({
          message: deltaOptions,
          $el,
          timeout: options.timeout,
          consoleProps () {
            return {
              'Applied To': $dom.getElements($el),
              'Elements': $el.length,
              'Options': deltaOptions,
            }
          },
        })
      }

      const node = $dom.stringify($el)

      if (!$dom.isTextLike($el.get(0))) {
        const word = $utils.plural(subject, 'contains', 'is')

        $errUtils.throwErrByPath('clear.invalid_element', {
          onFail: options._log,
          args: { word, node },
        })
      }

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
