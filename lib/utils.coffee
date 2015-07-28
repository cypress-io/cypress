os   = require("os")
path = require("path")

module.exports = {
  getPathToExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable())

  getPathToUserExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable().split("/")[0])

  getPlatformExecutable: ->
    switch p = os.platform()
      when "darwin" then "Cypress.app/Contents/MacOS/cypress"
      when "linux"  then "Cypress"
      when "win32"  then "Cypress.exe"
      else
        throw new Error("Platform: '#{p}' is not supported.")

  getDefaultAppFolder: ->
    switch p = os.platform()
      when "darwin" then "/Applications"
      when "linux"  then "/usr/local"
      # when "win32"   then "i/dont/know/yet"
      else
        throw new Error("Platform: '#{p}' is not supported.")

  getOs: ->
    switch p = os.platform()
      when "darwin" then "mac"
      when "linux"  then "linux64"
      when "win32"  then "win"
      else
        throw new Error("Platform: '#{p}' is not supported.")

}