@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  App.silenceConsole = ->
    c = console
    _.each ["log", "warn", "info", "error"], (fn) ->
      c[fn] = ->