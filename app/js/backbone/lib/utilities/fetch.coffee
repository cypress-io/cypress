@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  flattenedFetches = (entities) ->
    _.chain([entities]).flatten().compact().pluck("_fetch").value()

  App.commands.setHandler "when:fetched", (entities, callback) ->
    xhrs = flattenedFetches(entities)

    $.when(xhrs...).done ->
      callback()

  App.reqres.setHandler "fetched:entities", (entities) ->
    flattenedFetches(entities)