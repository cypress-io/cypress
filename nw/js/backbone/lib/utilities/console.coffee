@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  App.suppressConsole = ->
    c = console
    _.each ["log", "warn", "info", "error"], (fn) ->
      c[fn] = ->