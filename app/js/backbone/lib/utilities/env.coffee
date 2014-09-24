@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  _.extend App,
    env: (env) ->
      throw new Error("App.env must be passed 1 argument") if not env

      App._environment is env

  App.commands.setHandler "set:app:env", ->
    ## set environment to ci or web
    env = if window.mochaPhantomJS then "ci" else "web"
    App._environment = env