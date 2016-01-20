@App = do (Backbone, Marionette) ->

  App = new Marionette.Application

  App.addRegions
    aboutRegion:  "#about-region"
    mainRegion:   "#main-region"
    footerRegion: "#footer-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (options = {}) ->
    ## create a App.config model from the passed in options
    App.config = App.request("config:entity", options)

    # App.config.log("Starting Desktop App", options: _.omit(options, "backend"))

    ## create an App.updater model which is shared across the app
    # App.updater = App.request "new:updater:entity"

    ## our config + updater are ready
    # App.vent.trigger "app:entities:ready", App

    ## if we are updating then do not start the app
    ## or display any UI. just finish installing the updates

    switch
      when options.about
        about()
      when options.debug
        throw new Error("debug not implemented yet")
      when options.updating
        updating(options)
      else
        projects()

  about = ->
    App.vent.trigger("start:about:app", App.aboutRegion)

  updating = (options) ->
    ## display the GUI
    App.execute "gui:display", options.coords

    ## start the updates being applied app so the user knows its still a-happen-ning
    return App.execute "start:updates:applied:app", options.appPath, options.execPath

  projects = ->
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