@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  chalk = require("chalk")

  write = (str) ->
    process.stdout.write(str + "\n")

  displayToken = (token) ->
    write(token)
    process.exit()

  displayTokenError = ->
    write("An error occured receiving token.")
    process.exit(1)

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
        when options.getKey       then @getKey(user)
        when options.generateKey  then @generateKey(user)

    getKey: (user) ->
      ## require a session_token
      if ensureSessionToken(user)

        ## log out the API Token
        App.config.getToken(user)
          .then(displayToken)
          .catch(displayTokenError)

    generateKey: (user) ->
      ## require a session_token
      if ensureSessionToken(user)

        ## generate a new API Token
        App.config.generateToken(user)
          .then(displayToken)
          .catch(displayTokenError)

  App.commands.setHandler "handle:cli:arguments", (options = {}) ->
    API.parseCliOptions(options)