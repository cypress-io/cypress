import fs from 'fs'
import path from 'path'
import { notarize } from '@electron/notarize'
import type { AfterPackContext } from 'electron-builder'

export default async function afterSign (params: AfterPackContext): Promise<void> {
  if (process.platform !== 'darwin') {
    console.log('not Mac, skipping after sign hook')

    return
  }

  if (process.env.SKIP_NOTARIZATION) {
    console.log('SKIP_NOTARIZATION set, skipping after sign hook')

    return
  }

  console.log('afterSign hook triggered in', params.appOutDir)

  const appId = params.packager.appInfo.id
  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`)
  }

  console.log(`Notarizing ${appId} found at ${appPath}`)

  const { NOTARIZE_APP_APPLE_ID, NOTARIZE_APP_PASSWORD, NOTARIZE_APP_TEAM_ID } = process.env

  if (!NOTARIZE_APP_APPLE_ID) {
    throw new Error('Missing Apple id for notarization: NOTARIZE_APP_APPLE_ID')
  }

  if (!NOTARIZE_APP_PASSWORD) {
    throw new Error('Missing Apple password for notarization: NOTARIZE_APP_PASSWORD')
  }

  if (!NOTARIZE_APP_TEAM_ID) {
    throw new Error('Missing Apple team id for notarization: NOTARIZE_APP_TEAM_ID')
  }

  try {
    await notarize({
      appPath,
      appleId: NOTARIZE_APP_APPLE_ID,
      appleIdPassword: NOTARIZE_APP_PASSWORD,
      teamId: NOTARIZE_APP_TEAM_ID,
    })
  } catch (error) {
    console.error('could not notarize application')
    console.error(error)
    throw error
  }

  console.log(`Done notarizing ${appId}`)
}
