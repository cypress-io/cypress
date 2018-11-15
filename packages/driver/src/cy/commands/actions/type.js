/* eslint-disable
    brace-style,
    no-cond-assign,
    no-undef,
    no-unused-vars,
    one-var,
    prefer-rest-params,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const $ = require('jquery')
const Promise = require('bluebird')
const moment = require('moment')

const $dom = require('../../../dom')
const $elements = require('../../../dom/elements')
const $selection = require('../../../dom/selection')
const $Keyboard = require('../../../cypress/keyboard')
const $utils = require('../../../cypress/utils')
const $actionability = require('../../actionability')

const inputEvents = 'textInput input'.split(' ')

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const monthRegex = /^\d{4}-(0\d|1[0-2])$/
const weekRegex = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/
const timeRegex = /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.[0-9]{1,3})?$/

module.exports = function (Commands, Cypress, cy, state, config) {
  Cypress.on('test:before:run', () => {
    return $Keyboard.resetModifiers(state('document'), state('window'))
  })

  return Commands.addAll({ prevSubject: 'element' }, {
    type (subject, chars, options = {}) {
      let num, updateTable

      options = _.clone(options)
      //# allow the el we're typing into to be
      //# changed by options -- used by cy.clear()
      _.defaults(options, {
        $el: subject,
        log: true,
        verify: true,
        force: false,
        delay: 10,
        release: true,
        waitForAnimations: config('waitForAnimations'),
        animationDistanceThreshold: config('animationDistanceThreshold'),
      })

      if (options.log) {
        //# figure out the options which actually change the behavior of clicks
        const deltaOptions = $utils.filterOutOptions(options)

        const table = {}

        const getRow = (id, key, which) => {
          return table[id] || (function () {
            let obj

            table[id] = (obj = {})
            const modifiers = $Keyboard.activeModifiers()

            if (modifiers.length) {
              obj.modifiers = modifiers.join(', ')
            }

            if (key) {
              obj.typed = key
              if (which) {
                obj.which = which
              }
            }

            return obj
          })()
        }

        updateTable = function (id, key, column, which, value) {
          const row = getRow(id, key, which)

          row[column] = value || 'preventedDefault'
        }

        const getTableData = () =>
        //# transform table object into object with zero based index as keys
        {
          return _.reduce(_.values(table), (memo, value, index) => {
            memo[index + 1] = value

            return memo
          }
            , {})
        }

        options._log = Cypress.log({
          message: [chars, deltaOptions],
          $el: options.$el,
          consoleProps () {
            return {
              'Typed': chars,
              'Applied To': $dom.getElements(options.$el),
              'Options': deltaOptions,
              'table' () {
                return {
                  name: 'Key Events Table',
                  data: getTableData(),
                  columns: ['typed', 'which', 'keydown', 'keypress', 'textInput', 'input', 'keyup', 'change', 'modifiers'],
                }
              },
            }
          },
        })

        options._log.snapshot('before', { next: 'after' })
      }

      const isBody = options.$el.is('body')
      const isTextLike = $dom.isTextLike(options.$el)
      const isDate = $dom.isType(options.$el, 'date')
      const isTime = $dom.isType(options.$el, 'time')
      const isMonth = $dom.isType(options.$el, 'month')
      const isWeek = $dom.isType(options.$el, 'week')
      const hasTabIndex = $dom.isSelector(options.$el, '[tabindex]')

      //# TODO: tabindex can't be -1
      //# TODO: can't be readonly

      const isTypeableButNotAnInput = isBody || (hasTabIndex && !isTextLike)

      if (!isBody && !isTextLike && !hasTabIndex) {
        const node = $dom.stringify(options.$el)

        $utils.throwErrByPath('type.not_on_typeable_element', {
          onFail: options._log,
          args: { node },
        })
      }

      if ((num = options.$el.length) && (num > 1)) {
        $utils.throwErrByPath('type.multiple_elements', {
          onFail: options._log,
          args: { num },
        })
      }

      if (!(_.isString(chars) || _.isFinite(chars))) {
        $utils.throwErrByPath('type.wrong_type', {
          onFail: options._log,
          args: { chars },
        })
      }

      if (chars === '') {
        $utils.throwErrByPath('type.empty_string', { onFail: options._log })
      }

      if (isDate && (
        !_.isString(chars) ||
        !dateRegex.test(chars) ||
        !moment(chars).isValid()
      )) {
        $utils.throwErrByPath('type.invalid_date', {
          onFail: options._log,
          args: { chars },
        })
      }

      if (isMonth && (
        !_.isString(chars) ||
        !monthRegex.test(chars)
      )) {
        $utils.throwErrByPath('type.invalid_month', {
          onFail: options._log,
          args: { chars },
        })
      }

      if (isWeek && (
        !_.isString(chars) ||
        !weekRegex.test(chars)
      )) {
        $utils.throwErrByPath('type.invalid_week', {
          onFail: options._log,
          args: { chars },
        })
      }

      if (isTime && (
        !_.isString(chars) ||
        !timeRegex.test(chars)
      )) {
        $utils.throwErrByPath('type.invalid_time', {
          onFail: options._log,
          args: { chars },
        })
      }

      options.chars = `${chars}`

      const win = state('window')

      const getDefaultButtons = (form) => {
        return form.find('input, button').filter((__, el) => {
          const $el = $(el)

          return ($dom.isSelector($el, 'input') && $dom.isType($el, 'submit')) ||
          ($dom.isSelector($el, 'button') && !$dom.isType($el, 'button'))
        })
      }

      const type = function () {
        const simulateSubmitHandler = function () {
          const form = options.$el.parents('form')

          if (!form.length) {
            return
          }

          const multipleInputsAndNoSubmitElements = function (form) {
            const inputs = form.find('input')
            const submits = getDefaultButtons(form)

            return (inputs.length > 1) && (submits.length === 0)
          }

          //# throw an error here if there are multiple form parents

          //# bail if we have multiple inputs and no submit elements
          if (multipleInputsAndNoSubmitElements(form)) {
            return
          }

          const clickedDefaultButton = function (button) {
            //# find the 'default button' as per HTML spec and click it natively
            //# do not issue mousedown / mouseup since this is supposed to be synthentic
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

          //# bail if the default button is in a 'disabled' state
          if (defaultButtonisDisabled(defaultButton)) {
            return
          }

          //# issue the click event to the 'default button' of the form
          //# we need this to be synchronous so not going through our
          //# own click command
          //# as of now, at least in Chrome, causing the click event
          //# on the button will indeed trigger the form submit event
          //# so we dont need to fire it manually anymore!
          if (!clickedDefaultButton(defaultButton)) {
            //# if we werent able to click the default button
            //# then synchronously fire the submit event
            //# currently this is sync but if we use a waterfall
            //# promise in the submit command it will break again
            //# consider changing type to a Promise and juggle logging
            return cy.now('submit', form, { log: false, $el: form })
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

        const needSingleValueChange = () => {
          return $elements.isNeedSingleValueChangeInputElement(options.$el.get(0))
        }

        //# see comment in updateValue below
        let typed = ''

        const isContentEditable = $elements.isContentEditable(options.$el.get(0))
        const isTextarea = $elements.isTextarea(options.$el.get(0))

        return $Keyboard.type({
          $el: options.$el,
          chars: options.chars,
          delay: options.delay,
          release: options.release,
          window: win,

          updateValue (el, key) {
            //# in these cases, the value must only be set after all
            //# the characters are input because attemping to set
            //# a partial/invalid value results in the value being
            //# set to an empty string
            if (needSingleValueChange()) {
              typed += key
              if (typed === options.chars) {
                return $elements.setNativeProp(el, 'value', options.chars)
              }
            } else {
              return $selection.replaceSelectionContents(el, key)
            }
          },

          onBeforeType (totalKeys) {
            //# for the total number of keys we're about to
            //# type, ensure we raise the timeout to account
            //# for the delay being added to each keystroke
            return cy.timeout((totalKeys * options.delay), true, 'type')
          },

          onBeforeSpecialCharAction (id, key) {
            //# don't apply any special char actions such as
            //# inserting new lines on {enter} or moving the
            //# caret / range on left or right movements
            if (isTypeableButNotAnInput) {
              return false
            }
          },

          onBeforeEvent (id, key, column, which) {
            //# if we are an element which isnt text like but we have
            //# a tabindex then it can receive keyboard events but
            //# should not fire input or textInput and should not fire
            //# change events
            if (inputEvents.includes(column) && isTypeableButNotAnInput) {
              return false
            }
          },

          onEvent (id, key, column, which, value) {
            if (updateTable) {
              return updateTable(...arguments)
            }
          },

          //# fires only when the 'value'
          //# of input/text/contenteditable
          //# changes
          onValueChange (originalText, el) {
            //# contenteditable should never be called here.
            //# only input's and textareas can have change events
            let changeEvent

            if (changeEvent = state('changeEvent')) {
              if (!changeEvent(null, true)) {
                state('changeEvent', null)
              }

              return
            }

            return state('changeEvent', (id, readOnly) => {
              const changed = $elements.getNativeProp(el, 'value') !== originalText

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
            //# dont dispatch change events or handle
            //# submit event if we've pressed enter into
            //# a textarea or contenteditable
            let changeEvent

            if (isTextarea || isContentEditable) {
              return
            }

            //# if our value has changed since our
            //# element was activated we need to
            //# fire a change event immediately
            if (changeEvent = state('changeEvent')) {
              changeEvent(id)
            }

            //# handle submit event handler here
            return simulateSubmitHandler()
          },

          onNoMatchingSpecialChars (chars, allChars) {
            if (chars === '{tab}') {
              return $utils.throwErrByPath('type.tab', { onFail: options._log })
            }

            return $utils.throwErrByPath('type.invalid', {
              onFail: options._log,
              args: { chars, allChars },
            })

          },

        })
      }

      const handleFocused = function () {
        //# if it's the body, don't need to worry about focus
        if (isBody) {
          return type()
        }

        return $actionability.verify(cy, options.$el, options, {
          onScroll ($el, type) {
            return Cypress.action('cy:scrolled', $el, type)
          },

          onReady ($elToClick) {
            let el
            const $focused = cy.getFocused()

            if (el = cy.needsForceFocus()) {
              cy.fireFocus(el)
            }

            //# if we dont have a focused element
            //# or if we do and its not ourselves
            //# then issue the click
            if (!$focused || ($focused && ($focused.get(0) !== options.$el.get(0)))) {
              //# click the element first to simulate focus
              //# and typical user behavior in case the window
              //# is out of focus
              return cy.now('click', $elToClick, {
                $el: $elToClick,
                log: false,
                verify: false,
                _log: options._log,
                force: true, //# force the click, avoid waiting
                timeout: options.timeout,
                interval: options.interval,
              })
              .then(() => {
                return type()
              })
            }

            return type()

          },
        })
      }

      return handleFocused()
      .then(() => {
        cy.timeout($actionability.delay, true, 'type')

        return Promise
        .delay($actionability.delay, 'type')
        .then(() => {
          //# command which consume cy.type may
          //# want to handle verification themselves
          let verifyAssertions

          if (options.verify === false) {
            return options.$el
          }

          return (verifyAssertions = () => {
            return cy.verifyUpcomingAssertions(options.$el, options, {
              onRetry: verifyAssertions,
            })
          }
          )()
        })
      })
    },

    clear (subject, options = {}) {
      //# what about other types of inputs besides just text?
      //# what about the new HTML5 ones?
      _.defaults(options, {
        log: true,
        force: false,
      })

      //# blow up if any member of the subject
      //# isnt a textarea or text-like
      const clear = function (el, index) {
        const $el = $(el)

        if (options.log) {
          //# figure out the options which actually change the behavior of clicks
          const deltaOptions = $utils.filterOutOptions(options)

          options._log = Cypress.log({
            message: deltaOptions,
            $el,
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

        if (!$dom.isTextLike($el)) {
          const word = $utils.plural(subject, 'contains', 'is')

          $utils.throwErrByPath('clear.invalid_element', {
            onFail: options._log,
            args: { word, node },
          })
        }

        return cy.now('type', $el, '{selectall}{del}', {
          $el,
          log: false,
          verify: false, //# handle verification ourselves
          _log: options._log,
          force: options.force,
          timeout: options.timeout,
          interval: options.interval,
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
        let verifyAssertions

        return (verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(subject, options, {
            onRetry: verifyAssertions,
          })
        }
        )()
      })
    },
  })
}
