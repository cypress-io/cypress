$Cypress.register "Sandbox", (Cypress, _, $) ->

  createClock = (sinon, args...) ->
    sinon.useFakeTimers(args...)

  createSandbox = (sinon) ->
    sinon.format = -> ""

    sinon.sandbox.create()

  Cypress.on "restore", ->
    ## restore the sandbox if we've
    ## created one
    return if not @prop

    if clock = @prop("clock")
      clock.restore()

    if sandbox = @prop("sandbox")
      sandbox.restore()

  Cypress.Cy.extend
    _getSinon: ->
      sinon = @private("window").sinon
      if not sinon
        $Cypress.Utils.throwErrByPath("miscellaneous.no_sandbox")
      return sinon

    _getClock: (args...) ->
      ## TODO: need to accept context (window) as argument and
      ## use lolex directly?
      sinon = @_getSinon()
      clock  = @prop("clock") ? createClock(sinon, args...)

      @prop("clock", clock)

    ## think about making this "public" so
    ## users can utilize the root sandbox
    ## for clocks / special XHRs / etc
    _getSandbox: ->
      sinon = @_getSinon()
      sandbox = @prop("sandbox") ? createSandbox(sinon)

      @prop("sandbox", sandbox)
