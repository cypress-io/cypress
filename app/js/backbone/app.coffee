@Ecl = do (Backbone, Marionette) ->

  App = new Marionette.Application

  App.addRegions
    navRegion:   "#nav-region"
    mainRegion:  "#main-region"

  App.reqres.setHandler "default:region", -> App.mainRegion

  return App