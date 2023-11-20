import fs from 'fs'
import { downloadArtifact } from '@electron/get'
import { config } from './config'
import extractZip from 'extract-zip'
import debug from 'debug'
import path from 'path'

const logInfo = debug('cypress:mksnapshot:info')
const logDebug = debug('cypress:mksnapshot:debug')
const logError = debug('cypress:mksnapshot:error')

// -----------------
// Config
// -----------------
const { platform, binDir, mksnapshotBinary } = config
let { archToDownload } = config

// -----------------
// Correct arm to arm-x64
// -----------------
if (
  archToDownload != null &&
  archToDownload.startsWith('arm') &&
  process.platform !== 'darwin'
) {
  archToDownload += '-x64'
}

// -----------------
// Not supporting ARM architectures except Darwin
// -----------------
function checkArmArchitectures (version: string): boolean {
  if (process.arch.startsWith('arm') && process.platform !== 'darwin') {
    logError(
      `WARNING: mksnapshot does not run on ${process.arch}. Download
     https://github.com/electron/electron/releases/download/v${version}/mksnapshot-v${version}-${process.platform}-${process.arch}-x64.zip
     on a x64 ${process.platform} OS to generate ${archToDownload} snapshots.`,
    )

    return false
  }

  return true
}

// -----------------
// Download
// -----------------
function download (version: string) {
  return downloadArtifact({
    version,
    artifactName: 'mksnapshot',
    platform,
    arch: archToDownload,
  })
}

export async function attemptDownload (
  version: string,
  tryingBaseVersion: boolean,
) {
  if (!checkArmArchitectures(version)) {
    throw new Error(
      'Architecture not supported. Run with `DEBUG=\'cypress:mksnapshot:error\'` for more information',
    )
  }

  if (!tryingBaseVersion) {
    logInfo({
      platform,
      version,
      archToDownload,
      binDir,
      mksnapshotBinary,
    })
  }

  try {
    const zipPath = await download(version)

    await extractZip(zipPath, { dir: binDir })
    if (platform !== 'win32') {
      if (fs.existsSync(mksnapshotBinary)) {
        fs.chmod(mksnapshotBinary, '755', function (error) {
          if (error != null) throw error
        })
      }
    }

    return path.basename(zipPath).slice(0, -path.extname(zipPath).length)
  } catch (err) {
    // If the version was not supplied, but taken from the `package.json` version then
    // a mksnapshot version for it may not be available.
    // The below tries to remove the patch number and download the version that
    // matches `major.minor.0`
    const parts = version.split('.')
    const baseVersion = `${parts[0]}.${parts[1]}.0`

    logDebug(
      `Failed to download ${version}, falling back to semver minor ${baseVersion}`,
    )

    if (tryingBaseVersion) {
      throw err
    }

    const zipPath: string = await attemptDownload(baseVersion, true)

    return zipPath
  }
}
