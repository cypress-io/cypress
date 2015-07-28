os   = require("os")
path = require("path")

module.exports = {
  getPathToExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable())

  getPathToUserExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable().split("/")[0])

  getPlatformExecutable: ->
    switch p = os.platform()
      when "darwin"  then "Cypress.app/Contents/MacOS/cypress"
      when "linux64" then "Cypress"
      when "win64"   then "Cypress.exe"
      else
        throw new Error("Platform: '#{p}' is not supported.")

  getDefaultAppFolder: ->
    switch p = os.platform()
      when "darwin"  then "/Applications"
      when "linux64" then "/usr/local"
      # when "win64"   then "i/dont/know/yet"
      else
        throw new Error("Platform: '#{p}' is not supported.")
}