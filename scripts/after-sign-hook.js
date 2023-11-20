// from https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db
// to enable running this hook, set in "electron-builder.json" the option
// "afterSign": "./scripts/after-sign-hook.js"
const fs = require('fs')
const path = require('path')
let electron_notarize = require('@electron/notarize')

module.exports = async function (params) {
  // Only notarize the app on Mac OS.
  if (process.platform !== 'darwin') {
    console.log('not Mac, skipping after sign hook')

    return
  }

  if (process.env.SKIP_NOTARIZATION) {
    console.log('SKIP_NOTARIZATION set, skipping after sign hook')

    return
  }

  console.log('afterSign hook triggered in', params.appOutDir)

  // Same appId in electron-builder.
  let appId = 'com.electron.cypress'

  let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`)
  }

  console.log(`Notarizing ${appId} found at ${appPath}`)

  if (!process.env.NOTARIZE_APP_APPLE_ID) {
    throw new Error('Missing Apple id for notarization: NOTARIZE_APP_APPLE_ID')
  }

  if (!process.env.NOTARIZE_APP_PASSWORD) {
    throw new Error('Missing Apple password for notarization: NOTARIZE_APP_PASSWORD')
  }

  if (!process.env.NOTARIZE_APP_TEAM_ID) {
    throw new Error('Missing Apple team id for notarization: NOTARIZE_APP_TEAM_ID')
  }

  try {
    await electron_notarize.notarize({
      appBundleId: appId,
      appPath,
      appleId: process.env.NOTARIZE_APP_APPLE_ID,
      appleIdPassword: process.env.NOTARIZE_APP_PASSWORD,
      teamId: process.env.NOTARIZE_APP_TEAM_ID,
    })
  } catch (error) {
    console.error('could not notarize application')
    console.error(error)
    throw error
  }

  console.log(`Done notarizing ${appId}`)
}
