$Cypress.register "Sandbox", (Cypress, _, $) ->

  Cypress.on "defaults", ->
    ## why are we using a property here
    ## instead of going through @prop(...) ?
    @_sandbox = null

  Cypress.on "restore", ->
    ## restore the sandbox if we've
    ## created one
    if sandbox = @_sandbox
      sandbox.restore()

      ## if we have a server, resets
      ## these references for GC
      if server = sandbox.server
        server.requests  = []
        server.queue     = []
        server.responses = []

  $Cypress.Cy.extend
    ## think about making this "public" so
    ## users can utilize the root sandbox
    ## for clocks / special XHRs / etc
    _getSandbox: ->
      sinon = @sync.window().sinon

      if not sinon
        @throwErr("Could not access the Server, Routes, Stub, Spies, or Mocks. Check to see if your application is loaded and is visible. Please open an issue if you see this message.")

      @_sandbox ?= sinon.sandbox.create()