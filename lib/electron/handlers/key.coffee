user   = require("./user")
errors = require("./errors")

module.exports = {
  print: (projectPath) ->
    user.ensureSession()

    .then (session) ->
      ## get the API token
      user.getProjectToken(session, projectPath)

    .then (token) ->
      ## log this out to the console
      console.log(token)

    ## catch any errors and exit with them
    .catch(errors.exitWith)

  generate: (projectPath) ->
    user.ensureSession()

    .then (session) ->
      ## generate a new API Token
      user.generateProjectToken(session, projectPath)

    .then (token) ->
      ## log this out to the console
      console.log(token)

    ## catch any errors and exit with them
    .catch(errors.exitWith)
}