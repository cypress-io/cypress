@App.module "AutomationApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      config = App.request "app:config:entity"
      socket = App.request "socket:entity"

      browsers = App.request "new:browser:entities", config.get("browsers")

      defaultBrowser = browsers.extractDefaultBrowser()

      view = @getView(defaultBrowser, browsers)

      @listenTo view, "run:browser:clicked", (browser) ->
        ## here's where you write logic to open the url
        ## in a specific browser
        socket.emit "reload:browser", window.location.toString(), browser

      @show view

    getView: (browser, browsers) ->
      new List.Layout
        model: browser
        collection: browsers
