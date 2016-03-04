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
    App.ipc("change:coords", options.coords).then ->

      ## start the updates being applied app so the user knows its still a-happen-ning
      App.execute "start:updates:applied:app"

      ## and handle the logic for telling the updater to install
      App.ipc("updater:install", _.pick(options, "appPath", "execPath"))

  projects = ->
    ## check cache store for user
    App.ipc("get:current:user").then (user) ->
      # set the current user
      App.execute "set:current:user", user

      if user and user.session_token?
        App.vent.trigger "start:projects:app"
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

      ## create an App.updater model which is shared across the app
      App.updater = App.request "new:updater:entity", options.version

      sendErr = (err) ->
        App.ipc("gui:error", _.pick(err, "name", "message", "stack"))

      window.onerror = (message, source, lineno, colno, err) ->
        sendErr(err)

      window.onunhandledrejection = sendErr

      ## if we are updating then
      ## immediately return
      if options.updating
        return updating(options)

      switch mode
        when "about"
          about()
        when "debug"
          debug()
        when "updates"
          updates()
        else
          projects()

  return App