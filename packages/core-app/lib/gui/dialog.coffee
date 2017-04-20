dialog = require("electron").dialog

module.exports = {
  show: ->
    ## associate this dialog to the mainWindow
    ## so the user never loses track of which
    ## window the dialog belongs to. in other words
    ## if they blur off, they only need to focus back
    ## on the Cypress app for this dialog to appear again
    ## https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/Sheets/Concepts/AboutSheets.html

    props = {
      ## we only want the user to select a single
      ## directory. not multiple, and not files
      properties: ["openDirectory"]
    }

    new Promise (resolve, reject) ->
      dialog.showOpenDialog props, (paths = []) ->
        process.nextTick ->
          ## return the first path since there can only ever
          ## be a single directory selection
          resolve(paths[0])
}
