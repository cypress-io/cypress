@App = do (Backbone, Marionette) ->

  App = new Marionette.Application

  App.addRegions
    mainRegion:  "#main-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (options = {}) ->
    App.vent.trigger "start:projects:app"

  return App