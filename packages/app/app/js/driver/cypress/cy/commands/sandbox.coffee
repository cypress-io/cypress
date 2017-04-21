$Cypress.register "Sandbox", (Cypress, _, $) ->
  do (sinon) ->

    createSandbox = (sinon) ->
      $Cypress.Sinon.override(sinon)

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
        sandbox = @prop("sandbox") ? createSandbox(sinon)

        @prop("sandbox", sandbox)
