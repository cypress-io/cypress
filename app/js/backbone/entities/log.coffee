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
          moment(date).fromNow(true)

  class Entities.LogsCollection extends Entities.Collection
    model: Entities.Log

    comparator: (log) ->
      if date = log.get("timestamp")
        -moment(date).unix()

    refresh: ->
      @reset()
      @fetch()

    fetch: ->
      App.ipc("get:logs").bind(@).then(@add)

  API =
    getLogs: ->
      logs = new Entities.LogsCollection

      logs.fetch()

      logs

  App.reqres.setHandler "log:entities", (transport) ->
    API.getLogs(transport)