# launching an Electron application to be tested by Cypress
# is very similar to launching the Chrome browser
# with just extra flag to let the app know that Cypress wants to control it

R = require("ramda")
chrome = require("./chrome")

# prevent messing Chrome's arguments by cloning the object
electronAppLauncher = R.clone(chrome)
_defaultArgs = electronAppLauncher.defaultArgs

# TODO find the Electron app and main.js equivalent file to launch
# something like "<electron path> ."

# TODO find the name and the version of the app from "package.json" file?
electronAppLauncher.name = "electron-app"
electronAppLauncher.open = (browser, url, options = {}, automation) ->
  # TODO pass actual discovered start file
  pathToMainElectronFile = '.'

  cliArgs = R.clone(_defaultArgs)
  cliArgs.push("--cypress-runner-url=#{url}")
  electronAppLauncher.defaultArgs = cliArgs

  chrome.open.call(electronAppLauncher, browser, pathToMainElectronFile, options, automation)

module.exports = electronAppLauncher
