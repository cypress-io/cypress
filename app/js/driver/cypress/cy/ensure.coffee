do ($Cypress, _, $) ->

  commandOptions = ["exist", "exists", "visible", "length"]

  returnFalse = -> return false

  isScrollOrAuto = (prop) ->
    prop is "scroll" or prop is "auto"

  $Cypress.Cy.extend
    ensureSubject: ->
      subject = @prop("subject")

      if not subject?
        cmd = @prop("current").get("name")
        $Cypress.Utils.throwErrByPath("miscellaneous.no_subject", {
          args: { subject, cmd }
        })

      return subject

    ensureParent: ->
      current = @prop("current")

      if not current.get("prev")
        $Cypress.Utils.throwErrByPath("miscellaneous.orphan", {
          args: { cmd: current.get("name") }
        })

    ensureElementIsNotAnimating: ($el, coords = [], threshold) ->
      waitForAnimations = @Cypress.config("waitForAnimations")

      ## bail if we have disabled waiting on animations
      return if waitForAnimations is false

      threshold ?= @Cypress.config("animationDistanceThreshold")

      lastTwo = coords.slice(-2)

      ## bail if we dont yet have two points
      if lastTwo.length isnt 2
        $Cypress.Utils.throwErrByPath("dom.animation_check_failed")

      [point1, point2] = lastTwo

      distance = ->
        deltaX = point1.x - point2.x
        deltaY = point1.y - point2.y

        Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      ## verify that there is not a distance
      ## greater than a default of '5' between
      ## the points
      if distance() > threshold
        cmd  = @prop("current").get("name")
        node = $Cypress.Utils.stringifyElement($el)
        $Cypress.Utils.throwErrByPath("dom.animating", {
          args: { cmd, node }
        })

    ensureActionability: (subject, onFail) ->
      subject ?= @ensureSubject()

      cmd = @prop("current").get("name")

      if subject.prop("disabled")
        node = $Cypress.Utils.stringifyElement(subject)

        $Cypress.Utils.throwErrByPath("dom.disabled", {
          onFail
          args: { cmd, node }
        })

    ensureVisibility: (subject, onFail) ->
      subject ?= @ensureSubject()

      cmd = @prop("current").get("name")

      if not (subject.length is subject.filter(":visible").length)
        reason = $Cypress.Dom.getReasonElIsHidden(subject)
        node   = $Cypress.Utils.stringifyElement(subject)
        $Cypress.Utils.throwErrByPath("dom.not_visible", {
          onFail
          args: { cmd, node, reason }
        })

    ensureDom: (subject, cmd, log) ->
      subject ?= @ensureSubject()

      cmd ?= @prop("current").get("name")

      isWindow = $Cypress.Utils.hasWindow(subject)

      ## think about dropping the 'cmd' part
      ## and adding exactly what the subject is
      ## if its an object or array, just say Object or Array
      ## but if its a primitive, just print out its value like
      ## true, false, 0, 1, 3, "foo", "bar"
      if not (isWindow or $Cypress.Utils.hasElement(subject))
        console.warn("Subject is currently: ", subject)
        $Cypress.Utils.throwErrByPath("dom.non_dom", {
          onFail: log
          args: { cmd }
        })

      if not (isWindow or @_contains(subject))
        node = $Cypress.Utils.stringifyElement(subject)
        $Cypress.Utils.throwErrByPath("dom.detached", {
          onFail: log
          args: { cmd, node }
        })

      return subject

    ensureExistence: (subject) ->
      returnFalse = =>
        cleanup()

        return false

      cleanup = =>
        @prop("onBeforeLog", null)

      ## prevent any additional logs this is an implicit assertion
      @prop("onBeforeLog", returnFalse)

      ## verify the $el exists and use our default error messages
      ## TODO: always unbind if our expectation failed
      try
        $Cypress.Chai.expect(subject).to.exist
      catch err
        cleanup()

        throw err

    ensureElExistence: ($el) ->
      ## dont throw if this isnt even a DOM object
      # return if not $Cypress.Utils.isInstanceOf($el, $)

      ## ensure that we either had some assertions
      ## or that the element existed
      return if $el and $el.length

      ## TODO: REFACTOR THIS TO CALL THE CHAI-OVERRIDES DIRECTLY
      ## OR GO THROUGH I18N

      @ensureExistence($el)

    ensureNoCommandOptions: (options) ->
      _.each commandOptions, (opt) =>
        if _.has(options, opt)
          assertion = switch opt
            when "exist", "exists"
              if options[opt] then "exist" else "not.exist"
            when "visible"
              if options[opt] then "be.visible" else "not.be.visible"
            when "length"
              "have.length', '#{options[opt]}"

          $Cypress.Utils.throwErrByPath("miscellaneous.deprecated", {
            args: {
              assertion
              opt
              value: options[opt]
            }
          })

    ensureDescendents: ($el1, $el2, onFail) ->
      cmd = @prop("current").get("name")

      unless $Cypress.Utils.isDescendent($el1, $el2)
        if $el2
          node = $Cypress.Utils.stringifyElement($el2)
          $Cypress.Utils.throwErrByPath("dom.covered", {
            onFail
            args: { cmd, node }
          })
        else
          node = $Cypress.Utils.stringifyElement($el1)
          $Cypress.Utils.throwErrByPath("dom.hidden", {
            onFail
            args: { cmd, node }
          })

    ensureScrollability: ($el, cmd) ->
      throwErr = ($el) ->
        ## prep args to throw in error since we can't scroll
        cmd   ?= @prop("current").get("name")
        node  = $Cypress.Utils.stringifyElement($el)

        $Cypress.Utils.throwErrByPath("dom.not_scrollable", {
          args: { cmd, node }
        })

      ## if we're the window, we want to get the document's
      ## element and check it's size against the actual window
      if $Cypress.Utils.hasWindow($el)
        win = $el
        $el = $($el.document.documentElement)
        el  = $el[0]

        ## Check if body height is higher than window height
        return true if win.innerHeight < el.scrollHeight

        ## Check if body width is higher than window width
        return true if win.innerWidth < el.scrollWidth

        ## else throw an error since the window is not scrollable
        return throwErr(win)
      else
        ## if we're any other element, we do some css calculations
        ## to see that the overflow is correct and the scroll
        ## area is larger than the actual height or width
        el = $el[0]

        {overflow, overflowY, overflowX} = getComputedStyle(el)

        ## y axis
        ## if our content height is less than the total scroll height
        if el.clientHeight < el.scrollHeight
          ## and our element has scroll or auto overflow or overflowX
          return true if isScrollOrAuto(overflow) or isScrollOrAuto(overflowY)

        ## x axis
        if el.clientWidth < el.scrollWidth
          return true if isScrollOrAuto(overflow) or isScrollOrAuto(overflowX)

        throwErr($el)
