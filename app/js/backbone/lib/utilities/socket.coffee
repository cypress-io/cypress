@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  satelliteEvents = "runner:start runner:end before:run before:add after:add suite:add suite:start suite:stop test test:add test:start test:end after:run test:results:ready exclusive:test command:add command:attrs:changed".split(" ")
  hostEvents      = "load:spec:iframe".split(" ")
  passThruEvents  = "sauce:job:create sauce:job:start sauce:job:done sauce:job:fail".split(" ")

  API =
    start: ->
      ## connect to socket io
      channel = io.connect({path: "/__socket.io"})

      _.each hostEvents, (event) ->
        channel.on event, (args...) ->
          socket.trigger event, args...

      _.each satelliteEvents, (event) ->
        channel.on event, (args...) ->
          socket.trigger event, args...

      _.each passThruEvents, (event) ->
        channel.on event, (args...) ->
          socket.trigger event, args...

      channel.on "test:changed", (data) ->
        socket.trigger "test:changed", data.file

      channel.on "eclectus:css:changed", (data) ->
        ## find the eclectus stylesheet
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
      socket = App.request "io:entity", channel

      App.reqres.setHandler "socket:entity", -> socket

  App.commands.setHandler "socket:start", ->
    API.start()

  App.reqres.setHandler "satellite:events", -> satelliteEvents
  App.reqres.setHandler "host:events",      -> hostEvents
  App.reqres.setHandler "pass:thru:events", -> passThruEvents