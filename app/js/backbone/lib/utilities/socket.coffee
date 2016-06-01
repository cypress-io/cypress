@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  element = "__cypress-string"

  API =
    start: (socketId) ->
      ## connect to socket io
      channel = io.connect({path: "/__socket.io"})

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
