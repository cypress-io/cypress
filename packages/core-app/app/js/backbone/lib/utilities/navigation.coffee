@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  _.extend App,
    visit: (route, options = {}) ->
      Backbone.history.navigate route, options

    currentRoute: ->
      Backbone.history.fragment or null

    startHistory: ->
      Backbone.history.start()