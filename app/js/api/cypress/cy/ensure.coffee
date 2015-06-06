do ($Cypress, _) ->

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

    ensureDescendents: ($el1, $el2, onFail) ->
      method = @prop("current").name

      unless $Cypress.Utils.isDescendent($el1, $el2)
        if $el2
          node = $Cypress.Utils.stringifyElement($el2)
          @throwErr("Cannot call .#{method}() on this element because it is being covered by another element: #{node}", onFail)
        else
          @throwErr("Cannot call .#{method}() on this element because it is currently hidden from view.")