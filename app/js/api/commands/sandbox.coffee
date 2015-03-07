do (Cypress, _) ->

  Cypress.on "defaults", ->
    ## why are we using a property here
    ## instead of going through @prop(...) ?
    @_sandbox = null

  Cypress.on "after:run", ->
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

  Cypress.extend
    _getSandbox: ->
      sinon = @sync.window().sinon

      @throwErr("sinon.js was not found in the remote iframe's window.  This may happen if you testing a page you did not directly cy.visit(..).  This happens when you click a regular link.") if not sinon

      @_sandbox ?= sinon.sandbox.create()