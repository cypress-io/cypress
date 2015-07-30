@App = do (Backbone, Marionette) ->

  path     = require("path")
  minimist = require("minimist")
  args     = "apiKey smokeTest getKey generateKey ci silent debug updating headless coords".split(" ")

  App = new Marionette.Application

  ## I think this should be window.App not global
  global.App = App

  App.addRegions
    mainRegion:   "#main-region"
    footerRegion: "#footer-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (options) ->
    options = options.backend.parseArgs(options)

    ## suppress all console messages
    if options.silent
      App.suppressConsole()

    ## create a App.config model from the passed in options
    App.config = App.request("config:entity", options)

    App.config.log("Starting Desktop App", options: options)

    ## create an App.updater model which is shared across the app
    App.updater = App.request "new:updater:entity"

    ## our config + updater are ready
    App.vent.trigger "app:entities:ready", App

    ## if we are in smokeTest mode
    ## then just output the pong's value
    ## and exit
    if options.smokeTest
      process.stdout.write(options.pong + "\n")
      process.exit()

    ## if we are updating then do not start the app
    ## or display any UI. just finish installing the updates
    if options.updating
      ## display the GUI
      App.execute "gui:display", options.coords

      ## start the updates being applied app so the user knows its still a-happen-ning
      return App.execute "start:updates:applied:app", options.appPath, options.execPath

    App.config.getUser().then (user) ->
      ## check cache store for user

      ## set the current user
      App.execute "set:current:user", user

      if options.getKey or options.generateKey
        ## dont start the app because we need to output CLI info
        return App.execute "handle:cli:arguments", options

      ## make sure we have a current session
      if user?.session_token
        ## if have it, start projects
        App.vent.trigger "start:projects:app", options.projectPath
      else
        ## else login
        App.vent.trigger "start:login:app"

      ## display the footer
      App.vent.trigger "start:footer:app"

      ## dont display the gui if we're in headless mode
      return if options.headless

      ## display the GUI
      App.execute "gui:display", options.coords

  return App