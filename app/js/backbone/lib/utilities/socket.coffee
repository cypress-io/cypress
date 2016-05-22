@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  element = "__cypress-string"

  API =
    start: (socketId) ->
      ## connect to socket io
      channel = io.connect({path: "/__socket.io"})

      str = "" + Math.random()

      obj = {
        element: element
        string: str
      }

      $("##{element}").hide().text(obj.string)

      channel.on "connect", ->
        ## TODO: normalize this into lib/socket
        ## instead of the webapp
        channel.emit("app:connect", socketId) if socketId

        channel.emit "is:automation:connected", obj, (bool) ->
          ## once we get back our initial connection status
          ## we need to listen for disconnected events
          channel.on "automation:disconnected", ->
            ## this is a big deal and we need to nuke
            ## the client app
            socket.onAutomationDisconnected()

          socket.automationConnected(bool)

      # channel.on "check:for:app:errors", ->
      #   console.log "check:for:app:errors"
      #   socket.emit "app:errors", App.error

      channel.on "automation:push:message", (msg, data) ->
        socket.trigger "automation:push:message", msg, data

      channel.on "test:changed", (data) ->
        socket.trigger "test:changed", data.file

      channel.on "cypress:css:changed", (data) ->
        ## find the cypress stylesheet
        link = $("link").filter (index, link) ->
          ## replace a period with 1 back slash
          re = data.file.split(".").join("\\.")
          new RegExp(re).test $(link).attr("href")

        ## get the relative href excluding host, domain, etc
        href = new Uri(link.attr("href"))

        ## append a random time after it
        href.replaceQueryParam "t", _.now()

        ## set it back on the link
        link.attr("href", href.toString())

      ## create the app socket entity
      socket = App.request "io:entity", channel, socketId

      App.reqres.setHandler "socket:entity", -> socket

  App.commands.setHandler "socket:start", (socketId) ->
    API.start(socketId)
