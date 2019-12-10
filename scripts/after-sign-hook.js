// from https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db
// to enable running this hook, set in "electron-builder.json" the option
// "afterSign": "./scripts/after-sign-hook.js"
const fs = require('fs')
const path = require('path')
let electron_notarize = require('electron-notarize')

/* eslint-disable no-console */

module.exports = async function (params) {
  // Only notarize the app on Mac OS only.
  if (process.platform !== 'darwin') {
    console.log('not Mac, skipping after sign hook')

    return
  }

  console.log('afterSign hook triggered', params)

  // Same appId in electron-builder.
  let appId = 'com.electron.cypress'

  let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`)
  }

  console.log(`Notarizing ${appId} found at ${appPath}`)

  if (!process.env.appleId) {
    throw new Error('Missing Apple id for notarization')
  }

  if (!process.env.appleIdPassword) {
    throw new Error('Missing Apple password for notarization')
  }

  try {
    await electron_notarize.notarize({
      appBundleId: appId,
      appPath,
      appleId: process.env.appleId,
      appleIdPassword: process.env.appleIdPassword,
    })
  } catch (error) {
    console.error(error)
  }

  console.log(`Done notarizing ${appId}`)
}
