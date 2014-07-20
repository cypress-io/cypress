@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =

    start: ->
      ## should create a backbone model here
      ## to be shared with the entire app.
      ## that way everything else can just listen
      ## to it via normal triggered events
      ## App.request("socket:io:entity")

      socket = io.connect(location.host)

      socket.on "test:changed", (data) ->
        console.warn "test:changed", data

      socket.on "eclectus:css:changed", (data) ->
        ## find the eclectus stylesheet
        link = $("link").filter (index, link) ->
          new RegExp(data.file).test $(link).attr("href")

        ## get the relative href excluding host, domain, etc
        href = new Uri(link.attr("href"))

        ## append a random time after it
        href.replaceQueryParam "t", (new Date).getTime()

        ## set it back on the link
        link.attr("href", href.toString())

  App.commands.setHandler "socket:start", ->
    API.start()