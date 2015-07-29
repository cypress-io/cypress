@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  chalk = require("chalk")

  displayToken = (token) ->
    process.stdout.write(token + "\n")
    process.exit()

  ensureSessionToken = (user) ->
    ## bail if we have a session_token
    return true if user.get("session_token")

    ## else die and log out the auth error
    process.stdout.write chalk.red("Sorry, you are not currently logged into Cypress. This request requires authentication.\nPlease log into Cypress and then issue this command again.\n")
    process.exit(1)

  API =
    parseCliOptions: (options) ->
      user = App.currentUser

      switch
        when options.key          then @key(user)
        when options.generateKey  then @generateKey(user)

    key: (user) ->
      ## require a session_token
      if ensureSessionToken(user)

        ## log out the API Token
        App.config.getToken(user).then(displayToken)

    generateKey: (user) ->
      ## require a session_token
      if ensureSessionToken(user)

        ## generate a new API Token
        App.config.generateToken(user).then(displayToken)

  App.commands.setHandler "handle:cli:arguments", (options = {}) ->
    API.parseCliOptions(options)