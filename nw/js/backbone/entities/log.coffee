@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Log extends Entities.Model
    mutators:
      dataFormatted: ->
        return "" if _.isEmpty(@get("data"))

        try
          data = JSON.stringify(@get("data"))
          _.str.truncate(data, 80)
        catch
          ""

      timestampFormatted: ->
        if date = @get("timestamp")
          global.moment(date).fromNow(true)

  class Entities.LogsCollection extends Entities.Collection
    model: Entities.Log

    offLog: ->
      App.config.offLog()

    refresh: ->
      @reset()
      _.defer => @fetch()

    fetch: ->
      App.config.getLogs().then (array) =>
        @add(array)

    clear: ->
      App.config.clearLogs().then => @reset()

  API =
    getLogs: ->
      logs = new Entities.LogsCollection

      logs.fetch()

      App.config.onLog (log) ->
        logs.add(log)

      logs

  App.reqres.setHandler "log:entities", (transport) ->
    API.getLogs(transport)