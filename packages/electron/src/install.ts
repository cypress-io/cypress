import os from 'os'
import path from 'path'
import systeminformation from 'systeminformation'
import execa from 'execa'
import {
  getPathToDist,
  getPathToExec,
  getPathToVersion,
  getPathToResources,
} from './paths'
import Debug from 'debug'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import crypto from 'crypto'
import { flipFuses, FuseVersion, FuseV1Options } from '@electron/fuses'
import { move, remove } from 'fs-extra'
// @ts-ignore
import pkg from '@packages/root'

const debug = Debug('cypress:electron:install')

let electronVersion: string | undefined

// ensure we have an electronVersion set in package.json
if (!(electronVersion = pkg.devDependencies.electron)) {
  throw new Error(`Missing 'electron' devDependency in root package.json`)
}

export function getElectronVersion () {
  return electronVersion
}

// returns icons package so that the caller code can find
// paths to the icons without hard-coding them
export const icons = () => {
  return require('@packages/icons')
}

function checkCurrentVersion (pathToVersion: string) {
  // read in the version file
  return fs.readFile(pathToVersion, 'utf8').then((str) => {
    const version = str.replace('v', '')

    // and if it doesn't match the electron version
    // throw an error
    if (version !== electronVersion) {
      throw new Error(
        `Currently installed version: '${version}' does not match electronVersion: '${electronVersion}`,
      )
    }
  })
}

async function getFileHash (filePath: string): Promise<string> {
  const hash = crypto.createHash('sha1')
  const stream = createReadStream(filePath)

  await pipeline(stream, hash)

  return hash.digest('hex')
}

async function checkIconVersion () {
  // TODO: this seems wrong, it's hard coding the check only for OSX and not windows or linux (!?)
  const mainIconsPath = icons().getPathToIcon('cypress.icns')
  const cachedIconsPath = path.join(
    __dirname,
    '../Cypress/Cypress.app/Contents/Resources/electron.icns',
  )

  const [mainHash, cachedHash] = await Promise.all(
    [mainIconsPath, cachedIconsPath].map(getFileHash),
  )

  if (mainHash !== cachedHash) {
    throw new Error('Icon mismatch')
  }
}

async function checkBinaryArchCpuArch (
  pathToExec: string,
  platform: string,
  arch: string,
) {
  if (platform === 'darwin' && arch === 'x64') {
    return Promise.all([
      // get the current arch of the binary
      execa('lipo', ['-archs', pathToExec]).then(({ stdout }) => {
        return stdout
      }),

      // get the real arch of the system
      getRealArch(platform, arch),
    ]).then(([binaryArch, cpuArch]) => {
      debug('archs detected %o', { binaryArch, cpuArch })

      if (binaryArch !== cpuArch) {
        throw new Error(
          `built binary arch: '${binaryArch}' does not match system CPU arch: '${cpuArch}', binary needs rebuilding`,
        )
      }
    })
  }
}

export async function packageAndExit () {
  await pkgElectronApp()
  await remove(getPathToResources('app'))
  process.exit()
}

async function getRealArch (platform: string, arch: string) {
  if (platform === 'darwin' && arch === 'x64') {
    // see this comment for explanation of x64 -> arm64 translation
    // https://github.com/cypress-io/cypress/pull/25014/files#diff-85c4db7620ed2731baf5669a9c9993e61e620693a008199ca7c584e621b6a1fdR11
    return systeminformation.cpu().then(({ manufacturer }) => {
      // if the cpu is apple then return arm64 as the arch
      return manufacturer === 'Apple' ? 'arm64' : arch
    })
  }

  return arch
}

interface PkgElectronAppOptions {
  dist: string
  dir: string
  out: string
  name: string
  platform: string
  arch: string
  asar: boolean
  prune: boolean
  overwrite: boolean
  electronVersion: string
  icon: string
}

async function pkgElectronApp (
  options: Partial<PkgElectronAppOptions> = {},
) {
  /**
   * NOTE: electron-packager as of v16.0.0 does not play well with
   * our mksnapshot. Requiring the package in this way, dynamically, will
   * make it undiscoverable by mksnapshot, which is OK since electron-packager
   * is a build dependency.
   * Converted to use @electron/packager for >= v18.x.x.
   * This is the renamed electron-packager.
   *
   * TODO: split this into two libs; one being the build tool, and the other as
   * the runtime lib for opening Electron. This will allow us to import these
   * as normal.
   */

  const e = 'electron'
  const p = 'packager'
  const pkgr = require(`@${e}/${p}`)
  const icons = require('@packages/icons')

  const iconPath = icons.getPathToIcon('cypress')

  debug('package icon', iconPath)

  const platform = os.platform()
  const arch = os.arch()

  const resolvedOptions: PkgElectronAppOptions = {
    dist: getPathToDist(),
    dir: 'app',
    out: 'tmp',
    name: 'Cypress',
    platform,
    arch: await getRealArch(platform, arch),
    asar: false,
    prune: true,
    overwrite: true,
    electronVersion: electronVersion ?? '',
    icon: iconPath,
    ...options,
  }

  debug('packager options %j', resolvedOptions)
  const [appPath] = await pkgr(resolvedOptions)

  if (appPath && resolvedOptions.dist && (await fs.stat(appPath))) {
    debug('moving app to dist', appPath, resolvedOptions.dist)
    await move(appPath, resolvedOptions.dist)
    debug('removed app', path.dirname(appPath))
    await remove(path.dirname(appPath))
  }

  try {
    if (!['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE ?? '')) {
      await flipFuses(getPathToExec(), {
        version: FuseVersion.V1,
        resetAdHocDarwinSignature: platform === 'darwin' && arch === 'arm64',
        [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: true,
      })
    }
  } catch (err) {
    console.log((err as Error).stack)

    return process.exit(1)
  }
}

function ensure () {
  const arch = os.arch()
  const platform = os.platform()
  const pathToExec = getPathToExec()
  const pathToVersion = getPathToVersion()

  return Promise.all([
    // check the version of electron and re-build if updated
    checkCurrentVersion(pathToVersion),
    // check if the dist folder exist and re-build if not
    fs.stat(pathToExec),
    // Compare the icon in dist with the one in the icons
    // package. If different, force the re-build.
    checkIconVersion(),
  ]).then(() => {
    // check that the arch of the built binary matches our CPU
    return checkBinaryArchCpuArch(pathToExec, platform, arch)
  })

  // if all is good, then return without packaging a new electron app
}

export function check () {
  return ensure().catch((err) => {
    packageAndExit()
  })
}
