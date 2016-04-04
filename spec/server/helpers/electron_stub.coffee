## a stubbed out version of electron
## for using in all of our tests :-)
module.exports = {
  shell: {}
  dialog: {}
  ipcMain: {}
  nativeImage: {
    createFromPath: -> {}
  }
  app: {
    on: ->
    exit: ->
    commandLine: {
      appendSwitch: ->
    }
  }
  Tray: -> {
    on: ->
    setToolTip: ->
    setImage: ->
    setPressedImage: ->
  }
}