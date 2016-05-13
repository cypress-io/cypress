$Cypress.register "Sandbox", (Cypress, _, $) ->

  createSandbox = (sinon) ->
    sinon.format = -> ""

    sinon.sandbox.create()

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
        $Cypress.Utils.throwErrByPath("miscellaneous.no_sandbox")

      sandbox = @prop("sandbox") ? createSandbox(sinon)

      @prop("sandbox", sandbox)
