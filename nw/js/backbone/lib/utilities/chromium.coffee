@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  windows = {}

  API =
    startChromium: (src, options = {}) ->
      if win = windows.chromium
        win.close(true)

      if not src
        throw new Error("Missing src for tests to run. Cannot start Chromium.")

      _.defaults options,
        headless: false
        onReady: ->

      chromium = App.request "gui:open", src, {
        show: !options.headless
        frame: !options.headless
        position: "center"
        width: 1280
        height: 720
        title: "Running Tests"
      }

      chromium.once "document-end", ->
        options.onReady(chromium.window)

      windows.chromium = chromium

  App.commands.setHandler "start:chromium:run", (src, options) ->
    API.startChromium(src, options)