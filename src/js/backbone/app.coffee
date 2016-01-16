@App = do (Backbone, Marionette) ->

  App = new Marionette.Application

  App.addRegions
    mainRegion:   "#main-region"
    footerRegion: "#footer-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (options = {}) ->
    options = {}# options.backend.parseArgs(options)

    ## create a App.config model from the passed in options
    App.config = App.request("config:entity", options)

    # App.config.log("Starting Desktop App", options: _.omit(options, "backend"))

    ## create an App.updater model which is shared across the app
    # App.updater = App.request "new:updater:entity"

    ## our config + updater are ready
    # App.vent.trigger "app:entities:ready", App

    ## if we are updating then do not start the app
    ## or display any UI. just finish installing the updates
    if options.updating
      ## display the GUI
      App.execute "gui:display", options.coords

      ## start the updates being applied app so the user knows its still a-happen-ning
      return App.execute "start:updates:applied:app", options.appPath, options.execPath

    # App.vent.trigger "start:login:app"

    ## check cache store for user
    App.ipc("get:current:user").then (user) ->
      # set the current user
      App.execute "set:current:user", user

      if user and user.session_token?
        App.vent.trigger "start:projects:app"#, some args here
      else
        App.vent.trigger "start:login:app"

      App.vent.trigger "start:footer:app"

  return App