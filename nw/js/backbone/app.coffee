@App = do (Backbone, Marionette) ->

  parseArgv = (options) ->
    _.defaults options,
      env: if "--dev" in options.argv then "dev" else "prod"

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