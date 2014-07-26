@App = do (Backbone, Marionette) ->

  App = new Marionette.Application

  App.rootRoute = "/tests"

  App.addRegions
    navRegion:   "#nav-region"
    mainRegion:  "#main-region"

  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "before:start", (options = {}) ->

  App.on "start", (options = {}) ->
    ## start listening to socket io
    App.execute "socket:start"

    App.module("NavApp").start()

    App.startHistory()

    ## navigate to /tests if there is no current route
    App.visit(App.rootRoute) if not App.currentRoute()

  return App