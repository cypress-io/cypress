user   = require("./user")
errors = require("./errors")

module.exports = {
  print: (projectPath) ->
    user.ensureSession()

    .then (session) ->
      ## get the API token
      user.getProjectToken(projectPath, session)

    .then (token) ->
      ## log this out to the console
      console.log(token)

  generate: (projectPath) ->
    user.ensureSession()

    .then (session) ->
      ## generate a new API Token
      user.generateProjectToken(projectPath, session)

    .then (token) ->
      ## log this out to the console
      console.log(token)

}