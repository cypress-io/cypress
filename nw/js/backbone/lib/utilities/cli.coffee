@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  chalk = require("chalk")

  write = (str) ->
    process.stdout.write(str + "\n")

  writeErr = (str, msgs...) ->
    str = [chalk.red(str)].concat(msgs).join(" ")
    write(str)
    process.exit(1)

  displayToken = (token) ->
    write(token)
    process.exit()

  displayTokenError = ->
    writeErr("An error occured receiving token.")

  ensureSessionToken = (user) ->
    ## bail if we have a session_token
    return true if user.get("session_token")

    ## else die and log out the auth error
    write chalk.red("Sorry, you are not currently logged into Cypress. This request requires authentication.\nPlease log into Cypress and then issue this command again.")
    process.exit(1)

  API =
    parseCliOptions: (options) ->
      user = App.currentUser

      switch
        when options.ci           then @ci(options)
        when options.getKey       then @getKey(user)
        when options.generateKey  then @generateKey(user)
        # when options.openProject  then @openProject(user, options)
        when options.runProject   then @runProject(user, options)
        else
          @startGuiApp(options)

    getKey: (user) ->
      if ensureSessionToken(user)

        ## log out the API Token
        App.config.getToken(user)
          .then(displayToken)
          .catch(displayTokenError)

    generateKey: (user) ->
      if ensureSessionToken(user)

        ## generate a new API Token
        App.config.generateToken(user)
          .then(displayToken)
          .catch(displayTokenError)

    runProject: (user, options) ->
      if ensureSessionToken(user)
        App.vent.trigger "start:projects:app", {
          spec:        options.spec
          reporter:    options.reporter
          projectPath: options.projectPath
          onProjectNotFound: (path) ->
            writeErr("Cannot run project because it was not found:", chalk.blue(path))
        }

    ci: (options) ->
      ## bail if we arent in a recognized CI environment
      ## add project first
      ## then runProject

    startGuiApp: (options) ->
      if options.session
        ## if have it, start projects
        App.vent.trigger "start:projects:app"
      else
        ## else login
        App.vent.trigger "start:login:app"

      ## display the footer
      App.vent.trigger "start:footer:app"

      ## display the GUI
      App.execute "gui:display", options.coords

  App.commands.setHandler "handle:cli:arguments", (options = {}) ->
    API.parseCliOptions(options)