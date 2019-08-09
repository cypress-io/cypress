# launching an Electron application to be tested by Cypress
# is very similar to launching the Chrome browser
# with just extra flag to let the app know that Cypress wants to control it

R = require("ramda")
chrome = require("./chrome")

# prevent messing Chrome's arguments by cloning the object
electronAppLauncher = R.clone(chrome)
electronAppLauncher.defaultArgs.push("--cypress-runner")

module.exports = electronAppLauncher
