do ($Cypress, _, $) ->

  commandOptions = ["exist", "exists", "visible", "length"]

  $Cypress.Cy.extend
    ensureSubject: ->
      subject = @prop("subject")

      if not subject?
        name = @prop("current").name
        @throwErr("Subject is #{subject}!  You cannot call .#{name}() without a subject.")

      return subject

    ensureParent: ->
      current = @prop("current")

      if not current.prev
        @throwErr("cy.#{current.name}() is a child command which operates on an existing subject.  Child commands must be called after a parent command!")

    ensureVisibility: (subject, onFail) ->
      subject ?= @ensureSubject()

      method = @prop("current").name

      if not (subject.length is subject.filter(":visible").length)
        node = $Cypress.Utils.stringifyElement(subject)
        @throwErr("cy.#{method}() cannot be called on the non-visible element: #{node}", onFail)

    ensureDom: (subject, method) ->
      subject ?= @ensureSubject()

      method ?= @prop("current").name

      isWindow = $Cypress.Utils.hasWindow(subject)

      ## think about dropping the 'method' part
      ## and adding exactly what the subject is
      ## if its an object or array, just say Object or Array
      ## but if its a primitive, just print out its value like
      ## true, false, 0, 1, 3, "foo", "bar"
      if not (isWindow or $Cypress.Utils.hasElement(subject))
        console.warn("Subject is currently: ", subject)
        @throwErr("Cannot call .#{method}() on a non-DOM subject!")

      if not (isWindow or @_contains(subject))
        @throwErr("Cannot call .#{method}() because the current subject has been removed or detached from the DOM.")

      return subject

    ensureElExistance: ($el) ->
      ## dont throw if this isnt even a DOM object
      return if not $Cypress.Utils.isInstanceOf($el, $)

      ## ensure that we either had some assertions
      ## or that the element existed
      return if $el and $el.length

      ## TODO: REFACTOR THIS TO CALL THE CHAI-OVERRIDES DIRECTLY
      ## OR GO THROUGH I18N

      ## prevent any additional logs this is an implicit assertion
      @listenToOnce @Cypress, "before:log", -> return false

      ## verify the $el exists and use our default error messages
      $Cypress.Chai.expect($el).to.exist

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

          @throwErr("Command Options such as: '{#{opt}: #{options[opt]}}' have been deprecated. Instead write this as an assertion: .should('#{assertion}').")

    ensureDescendents: ($el1, $el2, onFail) ->
      method = @prop("current").name

      unless $Cypress.Utils.isDescendent($el1, $el2)
        if $el2
          node = $Cypress.Utils.stringifyElement($el2)
          @throwErr("Cannot call .#{method}() on this element because it is being covered by another element: #{node}", onFail)
        else
          @throwErr("Cannot call .#{method}() on this element because its center is currently hidden from view.", onFail)