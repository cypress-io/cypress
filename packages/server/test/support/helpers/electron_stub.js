// a stubbed out version of electron
// for using in all of our tests :-)
module.exports = {
  shell: {},
  dialog: {},
  ipcMain: {
    on () {},
    removeAllListeners () {},
  },
  nativeImage: {
    createFromPath () {
      return {}
    },
  },
  app: {
    on () {},
    exit () {},
    commandLine: {
      appendSwitch () {},
      getSwitchValue () {},
      appendArgument () {},
    },
    disableHardwareAcceleration () {},
    async whenReady () {},
    once () {},
  },
  systemPreferences: {
    isDarkMode () {},
    subscribeNotification () {},
  },
  BrowserWindow: {
    fromWebContents () {},
    getExtensions () {},
    removeExtension () {},
    addExtension () {},
  },
  Menu: {
    buildFromTemplate () {},
    setApplicationMenu () {},
  },
  Tray () {
    return {
      on () {},
      setToolTip () {},
      setImage () {},
      setPressedImage () {},
    }
  },
}
