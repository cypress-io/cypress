@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =

    start: ->
      ## create the app socket entity
      socket = App.request("io:entity")

      ## connect to socket io
      channel = io.connect()

      channel.on "test:changed", (data) ->
        socket.trigger "test:changed", data.file

      channel.on "eclectus:css:changed", (data) ->
        ## find the eclectus stylesheet
        link = $("link").filter (index, link) ->
          new RegExp(data.file).test $(link).attr("href")

        ## get the relative href excluding host, domain, etc
        href = new Uri(link.attr("href"))

        ## append a random time after it
        href.replaceQueryParam "t", _.now()

        ## set it back on the link
        link.attr("href", href.toString())

      App.reqres.setHandler "socket:entity", -> socket

  App.commands.setHandler "socket:start", ->
    API.start()