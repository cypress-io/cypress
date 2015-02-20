@App = do (Backbone, Marionette) ->

  parseArgv = (options) ->
    _.defaults options,
      env: process.env["NODE_ENV"]
      debug: "--debug" in options.argv
      updating: "--updating" in options.argv

    if options.updating
      _.extend options,
        appPath:  options.argv[0]
        execPath: options.argv[1]

    return options

  App = new Marionette.Application

  global.App = App

  App.addRegions
    mainRegion:   "#main-region"
    footerRegion: "#footer-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (options) ->
    options = parseArgv(options)

    ## create a App.config model from the passed in options
    App.config = App.request("config:entity", options)

    ## if we are updating then do not start the app
    ## or display any UI. just finish installing the updates
    if options.updating
      updater = App.request "new:updater:entity"
      updater.install(options.appPath, options.execPath)
      return

    App.config.getUser().then (user) ->
      ## check cache store for user

      ## set the current user
      App.execute "set:current:user", user

      ## make sure we have a current session
      if user?.session_token
        ## if have it, start projects
        App.vent.trigger "start:projects:app"
      else
        ## else login
        App.vent.trigger "start:login:app"

      ## display the footer
      App.vent.trigger "start:footer:app"

      ## display the GUI
      App.execute "gui:display"

  return App