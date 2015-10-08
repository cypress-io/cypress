$Cypress.register "XHR2", (Cypress, _) ->

  Cypress.on "restore", ->
    if server = @prop("server")
      server.restore()

  Cypress.on "before:window:load", (contentWindow) ->
    @startServer(contentWindow)

  Cypress.Cy.extend
    startServer: (contentWindow) ->
      ## do the same thing like what we did with the
      ## sandbox?

      ## abort outstanding XHR's that are still in flight?
      ## when moving between tests?
      @prop "server", $Cypress.Server2.initialize(contentWindow, {
        onSend: (xhr) ->
          Cypress.Log.command({
            message:   ""
            name:      "xhr"

            aliasType: "route"
            type:      "parent"
          })
      })