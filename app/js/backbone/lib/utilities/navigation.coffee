@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  _.extend App,
    visit: (route) ->
      Backbone.history.navigate route

    currentRoute: ->
      Backbone.history.fragment or null

    startHistory: ->
      Backbone.history.start()