@App = do (Backbone, Marionette) ->

  path = require("path")

  parseCoords = (args) ->
    coords = _.find args, (arg) -> _.str.startsWith(arg, "--coords")

    return if not coords
    [x, y] = coords.split("=")[1].split("x")
    {x: x, y: y}

  parseArgv = (options) ->
    _.defaults options,
      env: process.env["NODE_ENV"]
      debug:     "--debug"      in options.argv
      updating:  "--updating"   in options.argv
      smokeTest: "--smoke-test" in options.argv
      headless:  "--headless"   in options.argv
      coords: parseCoords(options.argv)

    if "--project" in options.argv
      options.projectPath = path.resolve(process.cwd(), options.argv[1])

    if options.updating
      _.extend options,
        appPath:  options.argv[0]
        execPath: options.argv[1]

    if options.smokeTest
      options.pong = options.argv[1].split("=")[1]

    return options

  App = new Marionette.Application

  ## I think this should be window.App not global
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