$Cypress.register "XHR2", (Cypress, _) ->

  Cypress.on "restore", ->
    if server = @prop("server")
      server.restore()

  Cypress.on "before:window:load", (contentWindow) ->
    @startXhrServer(contentWindow)

  Cypress.Cy.extend
    getXhrServer: ->
      @prop("server") ? @throwErr("The XHR server is unavailable or missing. This should never happen and most likely indicates a bug. Open an issue if you see this message.")

    startXhrServer: (contentWindow) ->
      logs = {}
      ## do the same thing like what we did with the
      ## sandbox?

      ## abort outstanding XHR's that are still in flight?
      ## when moving between tests?
      @prop "server", $Cypress.Server2.create(contentWindow, {
        testId: @private("runnable").id
        xhrUrl: @private("xhrUrl")
        onSend: (xhr, stack) ->
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

        onAbort: (xhr, stack) ->
          err = new Error("This XHR was aborted by your code -- check this stack trace below.")
          err.name = "AbortError"
          err.stack = stack

          if log = logs[xhr.id]
            log.snapshot().error(err)
      })

  Cypress.addParentCommand
    server2: (options = {}) ->
      _.defaults options,
        enable: true ## set enable to false to turn off stubbing

      @getXhrServer().set({})#options)

    route2: (args...) ->
      ## method / url / response / options
      ## url / response / options
      ## options

      _.defaults options,
        method: "GET"
        status: 200
        stub: true
        delay: undefined
        headers: undefined ## response headers
        response: undefined
        autoRespond: undefined
        waitOnResponse: undefined
        onRequest: ->
        onResponse: ->

      server = @getXhrServer()

      server.stub({url: /users/, status: 200, response: [{}, {}]})