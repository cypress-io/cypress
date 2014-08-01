@App = do (Backbone, Marionette) ->

  App = new Marionette.Application

  App.rootRoute = "/tests"

  App.addRegions
    navRegion:   "#nav-region"
    mainRegion:  "#main-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  ## set a handler to get the app config model
  App.reqres.setHandler "app:config:entity", -> App.config

  App.on "before:start", (options = {}) ->
    ## before we start lets receive the options passed to our app
    ## and setup some global application config
    App.config = App.request "new:config:entity", options

  App.on "start", (options = {}) ->
    ## start listening to socket io
    App.execute "socket:start"

    App.module("NavApp").start()

    App.startHistory()

    ## navigate to /tests if there is no current route
    App.visit(App.rootRoute) if not App.currentRoute()

  return App