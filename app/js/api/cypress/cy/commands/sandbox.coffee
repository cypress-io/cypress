$Cypress.register "Sandbox", (Cypress, _, $) ->

  Cypress.on "restore", ->
    ## restore the sandbox if we've
    ## created one
    return if not @prop

    if sandbox = @prop("sandbox")
      sandbox.restore()

  Cypress.Cy.extend
    ## think about making this "public" so
    ## users can utilize the root sandbox
    ## for clocks / special XHRs / etc
    _getSandbox: ->
      sinon = @private("window").sinon

      if not sinon
        @throwErr("Could not access the Server, Routes, Stub, Spies, or Mocks. Check to see if your application is loaded and is visible. Please open an issue if you see this message.")

      sandbox = @prop("sandbox") ? sinon.sandbox.create()

      @prop("sandbox", sandbox)