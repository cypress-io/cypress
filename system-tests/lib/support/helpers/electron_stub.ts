// a stubbed out version of electron
// for using in all of our tests :-)
export const shell = {}

export const dialog = {}

export const ipcMain = {
  on () {},
  removeAllListeners () {},
}

export const nativeImage = {
  createFromPath () {
    return {}
  },
}

export const app = {
  on () {},
  exit () {},
  commandLine: {
    appendSwitch () {},
    appendArgument () {},
  },
  disableHardwareAcceleration () {},
  async whenReady () {},
  dock: {
    show () {},
    hide () {},
  },
}

export const systemPreferences = {
  isDarkMode () {},
  subscribeNotification () {},
}

export const BrowserWindow = {
  fromWebContents () {},
  getExtensions () {},
  removeExtension () {},
  addExtension () {},
}

export const Menu = {
  buildFromTemplate () {},
  setApplicationMenu () {},
}

export function Tray () {
  return {
    on () {},
    setToolTip () {},
    setImage () {},
    setPressedImage () {},
  }
}
