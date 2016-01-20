@App = do (Backbone, Marionette) ->

  about = ->
    App.vent.trigger("start:about:app", App.aboutRegion)

  debug = ->
    App.vent.trigger("start:debug:app", App.debugRegion)

  updates = ->
    App.vent.trigger("start:updates:app", App.updatesRegion)

  updating = (options) ->
    ## if we are updating then do not start the app
    ## or display any UI. just finish installing the updates

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

  App = new Marionette.Application

  App.addRegions
    updatesRegion: "#updates-region"
    aboutRegion:   "#about-region"
    debugRegion:   "#debug-region"
    mainRegion:    "#main-region"
    footerRegion:  "#footer-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (mode) ->

    App.ipc("get:options").then (options = {}) ->

      ## create a App.config model from the passed in options
      App.config = App.request("config:entity", options)

      # App.config.log("Starting Desktop App", options: _.omit(options, "backend"))

      ## create an App.updater model which is shared across the app
      App.updater = App.request "new:updater:entity", options.version

      # window.onerror = (err) ->

      ## TODO: error handling window.onerror
      console.warn("setErrorHandler")
        # @getLog().setErrorHandler (err) =>
        #   ## exit if we're in production (blow up)
        #   return true if @env("production")

        #   ## else log out the err stack
        #   console.error(err)

        #   ## and go into debug mode if we should
        #   debugger if @get("debug")

      switch mode
        when "about"
          about()
        when "debug"
          debug()
        when "updates"
          updates()
        when "updating"
          updating(options)
        else
          projects()

  return App