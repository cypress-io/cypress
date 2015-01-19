@App = do (Backbone, Marionette) ->

  parseArgv = (argv) ->
    _.defaults {},
      env: if "--dev" in argv then "dev" else "prod"

  App = new Marionette.Application

  global.App = App

  App.addRegions
    mainRegion:  "#main-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (argv) ->
    options = parseArgv(argv)

    ## create a App.config model from the passed in options
    App.config = App.request("config:entity", options)


    ## check cache store for session id

    ## if have it, start projects

    ## else login
    App.vent.trigger "start:login:app"

    App.execute "gui:display"

  return App