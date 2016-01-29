cypressIcons = require("cypress-icons")
Tray         = require("electron").Tray

module.exports = {
  display: ->
    icon = new Tray(cypressIcons.getPathToTray("mac-normal.png"))
    icon.setToolTip("Cypress.io")
}