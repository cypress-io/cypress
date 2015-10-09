$Cypress.register "XHR2", (Cypress, _) ->

  Cypress.on "restore", ->
    if server = @prop("server")
      server.restore()

  Cypress.on "before:window:load", (contentWindow) ->
    @startServer(contentWindow)

  Cypress.Cy.extend
    startServer: (contentWindow) ->
      logs = {}
      ## do the same thing like what we did with the
      ## sandbox?

      ## abort outstanding XHR's that are still in flight?
      ## when moving between tests?
      @prop "server", $Cypress.Server2.initialize(contentWindow, {
        xhrUrl: @private("xhrUrl")
        onSend: (xhr) ->
          logs[xhr.id] = Cypress.Log.command({
            message:   ""
            name:      "xhr"
            displayName: if xhr.isStub then "xhr stub" else "xhr"
            # alias:     alias
            aliasType: "route"
            type:      "parent"
            # error:     err
            event:     true
            # onConsole: =>
            onRender: ($row) ->
              status = switch
                when xhr.aborted
                  klass = "aborted"
                  "(aborted)"
                when xhr.status > 0
                  xhr.status
                else
                  klass = "pending"
                  "---"

              klass ?= if /^2/.test(status) then "successful" else "bad"

              $row.find(".command-message").html ->
                [
                  "<i class='fa fa-circle #{klass}'></i>" + xhr.method,
                  status,
                  _.truncate(xhr.url, 20)
                ].join(" ")
          })

        onLoad: (xhr) ->
          if log = logs[xhr.id]
            log.set("foo", "bar").snapshot().end()

        onError: (xhr, err) ->
          if log = logs[xhr.id]
            log.snapshot().error(err)
      })

  Cypress.addParentCommand
    server2: (args...) ->

    route2: (args...) ->
      server = @prop("server")

      server.stub({url: /users/, status: 200, response: [{}, {}]})