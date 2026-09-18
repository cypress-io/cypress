// electron-builder deletes the Electron LICENSE and the Chromium notices while it builds the
// macOS app bundle (app-builder-lib's electronMac.js unlinks both from the app output dir).
// Linux and Windows keep them, because electron-builder renames LICENSE to LICENSE.electron.txt
// and Cypress zips the whole unpacked directory. On macOS Cypress zips only `Cypress.app`, so
// without this the archive would ship with no Electron or Chromium notices at all.
//
// This hook runs before electron-builder removes the files, so copy them into the app bundle's
// Resources directory, where they survive into the packaged and zipped application.
const fs = require('fs-extra')
const path = require('path')

const NOTICE_FILES = [
  ['LICENSE', 'LICENSE.electron.txt'],
  ['LICENSES.chromium.html', 'LICENSES.chromium.html'],
]

module.exports = async function (params) {
  if (params.electronPlatformName !== 'darwin') {
    return
  }

  const appBundle = fs.readdirSync(params.appOutDir)
  .find((entry) => entry.endsWith('.app'))

  if (!appBundle) {
    return console.log(`afterExtract hook: no .app bundle in ${params.appOutDir}, skipping Electron notices`)
  }

  const resourcesDir = path.join(params.appOutDir, appBundle, 'Contents', 'Resources')

  for (const [sourceName, destinationName] of NOTICE_FILES) {
    const sourcePath = path.join(params.appOutDir, sourceName)

    if (fs.existsSync(sourcePath)) {
      fs.copySync(sourcePath, path.join(resourcesDir, destinationName))
      console.log(`afterExtract hook: copied ${sourceName} to ${path.join(resourcesDir, destinationName)}`)
    }
  }
}
