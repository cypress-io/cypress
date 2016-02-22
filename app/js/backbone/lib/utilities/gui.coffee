@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  windows = {}

  API =
    about: ->
      ## TODO: fix focus
      App.ipc("window:open", {
        position: "center"
        width: 300
        height: 230
        toolbar: false
        title: "About"
        type: "ABOUT"
      })

    updates: ->
      App.ipc("window:open", {
        position: "center"
        width: 300
        height: 210
        toolbar: false
        title: "Updates"
        type: "UPDATES"
      })

    debug: ->
      App.ipc("window:open", {
        position: "center"
        width: 800
        height: 400
        toolbar: false
        title: "Debug Console"
        type: "DEBUG"
      })

    preferences: ->
      App.ipc("window:open", {
        position: "center"
        width: 520
        height: 270
        toolbar: false
        title: "Preferences"
        type: "PREFERENCES"
      })

    tests: ->
      return if not App.config.get("debug")

      tests = App.request "gui:open", "http://localhost:3500",
        position: "center"
        height: 1024
        width: 768
        title: "Cypress Tests"

      tests.once "loaded", ->
        tests.showDevTools()

  App.reqres.setHandler "gui:open", (url, options = {}) ->
    API.open(url, options)

  App.commands.setHandler "gui:check:for:updates", ->
    API.updates()

  App.commands.setHandler "gui:debug", ->
    API.debug()

  App.commands.setHandler "gui:tests", ->
    API.tests()

  App.commands.setHandler "gui:about", ->
    API.about()

  App.commands.setHandler "gui:preferences", ->
    API.preferences()