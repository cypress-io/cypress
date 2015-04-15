@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    start: (options) ->
      Utilities.Overrides.overloadMochaRunnerUncaught() if not App.config.ui("ci")

      ## return our reporter entity
      return App.request("reporter:entity")

    stop: (runner) ->
      runner.stop()

  App.reqres.setHandler "start:test:runner", (options = {}) ->
    API.start options

  App.reqres.setHandler "stop:test:runner", (runner) ->
    API.stop(runner)