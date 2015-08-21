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

  ## handle choosing the main nav
  App.vent.on "main:nav:choose", (nav) -> App.navs.chooseByName nav

  App.on "before:start", (options = {}) ->
    ## and nuke them all on beforeunload
    App.clearAllCookiesBeforeUnload()

    ## nuke all of our cookies
    App.clearAllCookies()

    ## before we start lets receive the options passed to our app
    ## and setup some global application config
    App.config = App.request "new:config:entity", options

    ## store the main nav collection
    App.navs = App.request "nav:entities"

  App.on "start", (options = {}) ->
    ## start listening to socket io
    App.execute "socket:start"

    App.config.setEnv options.env

    App.config.setUI("web")

    App.module("NavApp").start(App.navs)

    App.startHistory()

    ## navigate to /tests if there is no current route
    App.visit(App.rootRoute, trigger: true) if not App.currentRoute()

  return App