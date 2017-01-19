$Cypress.register "Clock", (Cypress) ->
  do (lolex) ->

    Cypress.on "test:before:run", ->
      ## remove clock before each test run, so a new one is created
      ## when user calls cy.clock()
      @prop("clock", null)

    Cypress.on "before:window:load", (contentWindow) ->
      ## if a clock has been created before this event (likely before
      ## a cy.visit(), then bind that clock to the new window
      if clock = @prop("clock")
        clock._bind(contentWindow)

    Cypress.on "restore", ->
      ## restore the clock if we've created one
      return if not @prop

      if clock = @prop("clock")
        clock.restore()

    Cypress.Cy.extend

      clock: (now, methods) ->
        if clock = @prop("clock")
          $Cypress.Utils.throwErrByPath("clock.already_created")
        else
          clock = $Cypress.Clock.create(@private("window"), now, methods, {
            onRestore: =>
              @prop("clock", null)
          })

          @prop("clock", clock)
