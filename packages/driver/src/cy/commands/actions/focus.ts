import _ from 'lodash'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $elements from '../../../dom/elements'
import $selection from '../../../dom/selection'
import type { Log } from '../../../cypress/log'

interface InternalFocusOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
  $el: JQuery
  error: boolean
  verify: boolean
}

interface InternalBlurOptions extends Partial<Cypress.BlurOptions> {
  _log?: Log
  $el: JQuery
  $focused: JQuery
  error: boolean
  verify: boolean
}

export default (Commands, Cypress, cy) => {
  return Commands.addAll({ prevSubject: ['element', 'window'] }, {
    focus (subject, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      // we should throw errors by default!
      // but allow them to be silenced
      const options: InternalFocusOptions = _.defaults({}, userOptions, {
        $el: subject,
        error: true,
        log: true,
        verify: true,
      })

      const isWin = $dom.isWindow(options.$el)

      if (isWin) {
        // get this into a jquery object
        options.$el = $dom.wrap(options.$el)
      }

      options._log = Cypress.log({
        $el: options.$el,
        timeout: options.timeout,
        hidden: options.log === false,
        consoleProps () {
          return { 'Applied To': $dom.getElements(options.$el) }
        },
      })

      const el = options.$el.get(0)

      // the body is not really focusable, but it
      // can have focus on initial page load.
      // this is instead a noop.
      // TODO: throw on body instead (breaking change)
      const isBody = $dom.isJquery(options.$el) &&
      $elements.isElement(options.$el.get(0)) &&
      $elements.isBody(options.$el.get(0))

      // https://dev.w3.org/html5/spec-LC/editing.html#specially-focusable
      // ensure there is only 1 dom element in the subject
      // make sure its allowed to be focusable
      if (!(isWin || isBody || $dom.isFocusable(options.$el))) {
        if (options.error === false) {
          return
        }

        const node = $dom.stringify(options.$el)

        $errUtils.throwErrByPath('focus.invalid_element', {
          onFail: options._log,
          args: { node },
        })
      }

      if (options.$el.length && options.$el.length > 1) {
        if (options.error === false) {
          return
        }

        $errUtils.throwErrByPath('focus.multiple_elements', {
          onFail: options._log,
          args: { num: options.$el.length },
        })
      }

      cy.fireFocus(el)

      if (Cypress.isBrowser('webkit') && (
        $elements.isInput(el) || $elements.isTextarea(el)
      )) {
        // Force selection to end in WebKit, unless selection
        // has been set by user.
        // It's a curried function, so the 2 arguments are valid.
        // @ts-ignore
        $selection.moveSelectionToEnd(el, {
          onlyIfEmptySelection: true,
        })
      }

      const verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    },

    blur (subject, userOptions: Partial<Cypress.BlurOptions> = {}) {
      // we should throw errors by default!
      // but allow them to be silenced
      const options: InternalBlurOptions = _.defaults({}, userOptions, {
        $el: subject,
        $focused: cy.getFocused(),
        error: true,
        log: true,
        verify: true,
        force: false,
      })

      const { $focused } = options

      const isWin = $dom.isWindow(options.$el)

      if (isWin) {
        // get this into a jquery object
        options.$el = $dom.wrap(options.$el)
      }

      const isBody = options.$el.is('body')

      // figure out the options which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options)

      options._log = Cypress.log({
        $el: options.$el,
        hidden: !options.log,
        message: deltaOptions,
        timeout: options.timeout,
        consoleProps () {
          return { 'Applied To': $dom.getElements(options.$el) }
        },
      })

      if (options.$el.length && options.$el.length > 1) {
        if (options.error === false) {
          return
        }

        $errUtils.throwErrByPath('blur.multiple_elements', {
          onFail: options._log,
          args: { num: options.$el.length },
        })
      }

      // if we haven't forced the blur, and we don't currently
      // have a focused element OR we aren't the window or body then error
      if (options.force !== true && !$focused && !isWin && !isBody) {
        if (options.error === false) {
          return
        }

        $errUtils.throwErrByPath('blur.no_focused_element', { onFail: options._log })
      }

      // if we're currently window dont check for the wrong
      // focused element because window will not show up
      // as $focused
      if (options.force !== true &&
        !isWin &&
        !isBody &&
        options.$el.get(0) !== $focused.get(0)
      ) {
        if (options.error === false) {
          return
        }

        const node = $dom.stringify($focused)

        $errUtils.throwErrByPath('blur.wrong_focused_element', {
          onFail: options._log,
          args: { node },
        })
      }

      const el = options.$el.get(0)

      cy.fireBlur(el)

      const verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    },
  })
}
