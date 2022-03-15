import _ from 'lodash'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $elements from '../../../dom/elements'

interface InternalFocusOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: any
  $el: JQuery
  error: boolean
  verify: boolean
}

interface InternalBlurOptions extends Partial<Cypress.BlurOptions> {
  _log?: any
  $el: JQuery
  $focused: JQuery
  error: boolean
  verify: boolean
}

export default (Commands, Cypress, cy) => {
  return Commands.addAll({ prevSubject: ['element', 'window'] }, {
    focus (subject, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      // we should throw errors by default!
      // but allow them to be silenced
      const _options: InternalFocusOptions = _.defaults({}, options, {
        $el: subject,
        error: true,
        log: true,
        verify: true,
      })

      const isWin = $dom.isWindow(_options.$el)

      if (isWin) {
        // get this into a jquery object
        _options.$el = $dom.wrap(_options.$el)
      }

      if (_options.log) {
        _options._log = Cypress.log({
          $el: _options.$el,
          timeout: _options.timeout,
          consoleProps () {
            return { 'Applied To': $dom.getElements(_options.$el) }
          },
        })
      }

      const el = _options.$el.get(0)

      // the body is not really focusable, but it
      // can have focus on initial page load.
      // this is instead a noop.
      // TODO: throw on body instead (breaking change)
      const isBody = $dom.isJquery(_options.$el) &&
      $elements.isElement(_options.$el.get(0)) &&
      $elements.isBody(_options.$el.get(0))

      // http://www.w3.org/$R/html5/editing.html#specially-focusable
      // ensure there is only 1 dom element in the subject
      // make sure its allowed to be focusable
      if (!(isWin || isBody || $dom.isFocusable(_options.$el))) {
        if (_options.error === false) {
          return
        }

        const node = $dom.stringify(_options.$el)

        $errUtils.throwErrByPath('focus.invalid_element', {
          onFail: _options._log,
          args: { node },
        })
      }

      if (_options.$el.length && _options.$el.length > 1) {
        if (_options.error === false) {
          return
        }

        $errUtils.throwErrByPath('focus.multiple_elements', {
          onFail: _options._log,
          args: { num: _options.$el.length },
        })
      }

      cy.fireFocus(el)

      const verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(_options.$el, _options, {
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    },

    blur (subject, options: Partial<Cypress.BlurOptions> = {}) {
      // we should throw errors by default!
      // but allow them to be silenced
      const _options: InternalBlurOptions = _.defaults({}, options, {
        $el: subject,
        $focused: cy.getFocused(),
        error: true,
        log: true,
        verify: true,
        force: false,
      })

      const { $focused } = _options

      const isWin = $dom.isWindow(_options.$el)

      if (isWin) {
        // get this into a jquery object
        _options.$el = $dom.wrap(_options.$el)
      }

      const isBody = _options.$el.is('body')

      if (_options.log) {
        // figure out the options which actually change the behavior of clicks
        const deltaOptions = $utils.filterOutOptions(_options)

        _options._log = Cypress.log({
          $el: _options.$el,
          message: deltaOptions,
          timeout: _options.timeout,
          consoleProps () {
            return { 'Applied To': $dom.getElements(_options.$el) }
          },
        })
      }

      if (_options.$el.length && _options.$el.length > 1) {
        if (_options.error === false) {
          return
        }

        $errUtils.throwErrByPath('blur.multiple_elements', {
          onFail: _options._log,
          args: { num: _options.$el.length },
        })
      }

      // if we haven't forced the blur, and we don't currently
      // have a focused element OR we aren't the window or body then error
      if (_options.force !== true && !$focused && !isWin && !isBody) {
        if (_options.error === false) {
          return
        }

        $errUtils.throwErrByPath('blur.no_focused_element', { onFail: _options._log })
      }

      // if we're currently window dont check for the wrong
      // focused element because window will not show up
      // as $focused
      if (_options.force !== true &&
        !isWin &&
        !isBody &&
        _options.$el.get(0) !== $focused.get(0)
      ) {
        if (_options.error === false) {
          return
        }

        const node = $dom.stringify($focused)

        $errUtils.throwErrByPath('blur.wrong_focused_element', {
          onFail: _options._log,
          args: { node },
        })
      }

      const el = _options.$el.get(0)

      cy.fireBlur(el)

      const verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(_options.$el, _options, {
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    },
  })
}
