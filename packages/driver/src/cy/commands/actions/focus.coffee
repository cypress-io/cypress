_ = require("lodash")
Promise = require("bluebird")

$dom = require("../../../dom")
$utils = require("../../../cypress/utils")
$errUtils = require("../../../cypress/error_utils")
$elements = require("../../../dom/elements")
$actionability = require("../../actionability")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: ["element", "window"] }, {
    focus: (subject, options = {}) ->
      ## we should throw errors by default!
      ## but allow them to be silenced
      _.defaults(options, {
        $el: subject
        error: true
        log: true
        verify: true
      })

      if isWin = $dom.isWindow(options.$el)
        ## get this into a jquery object
        options.$el = $dom.wrap(options.$el)

      if options.log
        options._log = Cypress.log
          $el: options.$el
          consoleProps: ->
            "Applied To": $dom.getElements(options.$el)

      el = options.$el.get(0)

      ## the body is not really focusable, but it
      ## can have focus on initial page load.
      ## this is instead a noop.
      ## TODO: throw on body instead (breaking change)
      isBody = $dom.isJquery(options.$el) &&
        $elements.isElement(options.$el.get(0)) &&
        $elements.isBody(options.$el.get(0))

      ## http://www.w3.org/$R/html5/editing.html#specially-focusable
      ## ensure there is only 1 dom element in the subject
      ## make sure its allowed to be focusable
      if not (isWin or isBody or $dom.isFocusable(options.$el))
        return if options.error is false

        node = $dom.stringify(options.$el)
        $errUtils.throwErrByPath("focus.invalid_element", {
          onFail: options._log
          args: { node }
        })

      if (num = options.$el.length) and num > 1
        return if options.error is false

        $errUtils.throwErrByPath("focus.multiple_elements", {
          onFail: options._log
          args: { num }
        })


      cy.fireFocus(el)

      # return options.$el if options.verify is false

      do verifyAssertions = ->
        cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions
        })

    blur: (subject, options = {}) ->
      ## we should throw errors by default!
      ## but allow them to be silenced
      _.defaults(options, {
        $el: subject
        $focused: cy.getFocused()
        error: true
        log: true
        verify: true
        force: false
      })

      { $el, $focused } = options

      if isWin = $dom.isWindow(options.$el)
        ## get this into a jquery object
        options.$el = $dom.wrap(options.$el)

      isBody = options.$el.is("body")

      if options.log
        ## figure out the options which actually change the behavior of clicks
        deltaOptions = $utils.filterOutOptions(options)

        options._log = Cypress.log
          $el: options.$el
          message: deltaOptions
          consoleProps: ->
            "Applied To": $dom.getElements(options.$el)

      if (num = options.$el.length) and num > 1
        return if options.error is false

        $errUtils.throwErrByPath("blur.multiple_elements", {
          onFail: options._log
          args: { num }
        })

      ## if we haven't forced the blur, and we don't currently
      ## have a focused element OR we aren't the window or body then error
      if (options.force isnt true) and (not $focused) and (not isWin) and (not isBody)
        return if options.error is false

        $errUtils.throwErrByPath("blur.no_focused_element", { onFail: options._log })

      ## if we're currently window dont check for the wrong
      ## focused element because window will not show up
      ## as $focused
      if (options.force isnt true) and (not isWin) and (not isBody) and (
        options.$el.get(0) isnt $focused.get(0)
      )
        return if options.error is false

        node = $dom.stringify($focused)
        $errUtils.throwErrByPath("blur.wrong_focused_element", {
          onFail: options._log
          args: { node }
        })

      el = options.$el.get(0)

      cy.fireBlur(el)

      do verifyAssertions = ->
        cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions
        })
  })
