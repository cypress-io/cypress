@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    start: (options) ->
      Utilities.Overrides.overloadMochaRunnerUncaught() if not App.config.ui("ci")

      ## return our runner entity
      return App.request("runner:entity")

    stop: (runner) ->
      Utilities.Overrides.restore()

      runner.stop()

  App.reqres.setHandler "start:test:runner", (options = {}) ->
    API.start options

  App.reqres.setHandler "stop:test:runner", (runner) ->
    API.stop(runner)