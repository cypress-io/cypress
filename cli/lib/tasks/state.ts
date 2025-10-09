import _ from 'lodash'
import os from 'os'
import path from 'path'
import untildify from 'untildify'
import Debug from 'debug'
import { cwd } from 'process'
import fs from 'fs-extra'
import util from '../util'

const debug = Debug('cypress:cli')

const getPlatformExecutable = (): string => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return 'Contents/MacOS/Cypress'
    case 'linux': return 'Cypress'
    case 'win32': return 'Cypress.exe'
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const getPlatFormBinaryFolder = (): string => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return 'Cypress.app'
    case 'linux': return 'Cypress'
    case 'win32': return 'Cypress'
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const getBinaryPkgPath = (binaryDir: string): string => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return path.join(binaryDir, 'Contents', 'Resources', 'app', 'package.json')
    case 'linux': return path.join(binaryDir, 'resources', 'app', 'package.json')
    case 'win32': return path.join(binaryDir, 'resources', 'app', 'package.json')
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

/**
 * Get path to binary directory
*/
const getBinaryDir = (version: string = util.pkgVersion()): string => {
  return path.join(getVersionDir(version), getPlatFormBinaryFolder())
}

const getVersionDir = (version: string = util.pkgVersion(), buildInfo: any = util.pkgBuildInfo()): string => {
  if (buildInfo && !buildInfo.stable) {
    version = ['beta', version, buildInfo.commitBranch, buildInfo.commitSha.slice(0, 8)].join('-')
  }

  return path.join(getCacheDir(), version)
}

/**
 * When executing "npm postinstall" hook, the working directory is set to
 * "<current folder>/node_modules/cypress", which can be surprising when using relative paths.
 */
const isInstallingFromPostinstallHook = (): boolean => {
  // individual folders
  const cwdFolders = cwd().split(path.sep)
  const length = cwdFolders.length

  return cwdFolders[length - 2] === 'node_modules' && cwdFolders[length - 1] === 'cypress'
}

const getCacheDir = (): string => {
  let cache_directory = util.getCacheDir()

  if (util.getEnv('CYPRESS_CACHE_FOLDER')) {
    const envVarCacheDir = untildify(util.getEnv('CYPRESS_CACHE_FOLDER') as string)

    debug('using environment variable CYPRESS_CACHE_FOLDER %s', envVarCacheDir)

    if (!path.isAbsolute(envVarCacheDir) && isInstallingFromPostinstallHook()) {
      const packageRootFolder = path.join('..', '..', envVarCacheDir)

      cache_directory = path.resolve(packageRootFolder)
      debug('installing from postinstall hook, original root folder is %s', packageRootFolder)
      debug('and resolved cache directory is %s', cache_directory)
    } else {
      cache_directory = path.resolve(envVarCacheDir)
    }
  }

  return cache_directory
}

const parseRealPlatformBinaryFolderAsync = async (binaryPath: string): Promise<any> => {
  const realPath = await fs.realpath(binaryPath)

  debug('CYPRESS_RUN_BINARY has realpath:', realPath)
  if (!realPath.toString().endsWith(getPlatformExecutable())) {
    return false
  }

  if (os.platform() === 'darwin') {
    return path.resolve(realPath, '..', '..', '..')
  }

  return path.resolve(realPath, '..')
}

const getDistDir = (): string => {
  return path.join(__dirname, '..', '..', 'dist')
}

/**
 * Returns full filename to the file that keeps the Test Runner verification state as JSON text.
 * Note: the binary state file will be stored one level up from the given binary folder.
 * @param {string} binaryDir - full path to the folder holding the binary.
 */
const getBinaryStatePath = (binaryDir: string): string => {
  return path.join(binaryDir, '..', 'binary_state.json')
}

const getBinaryStateContentsAsync = async (binaryDir: string): Promise<any> => {
  const fullPath = getBinaryStatePath(binaryDir)

  try {
    const contents = await fs.readJson(fullPath)

    debug('binary_state.json contents:', contents)

    return contents
  } catch (error: any) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      debug('could not read binary_state.json file at "%s"', fullPath)

      return {}
    }

    throw error
  }
}

const getBinaryVerifiedAsync = async (binaryDir: string): Promise<boolean> => {
  const contents = await getBinaryStateContentsAsync(binaryDir)

  return contents.verified
}

const clearBinaryStateAsync = async (binaryDir: string): Promise<void> => {
  await fs.remove(getBinaryStatePath(binaryDir))
}

/**
 * Writes the new binary status.
 * @param {boolean} verified The new test runner state after smoke test
 * @param {string} binaryDir Folder holding the binary
 * @returns {Promise<void>} returns a promise
 */
const writeBinaryVerifiedAsync = async (verified: boolean, binaryDir: string): Promise<void> => {
  const contents = await getBinaryStateContentsAsync(binaryDir)

  await fs.outputJson(
    getBinaryStatePath(binaryDir),
    _.extend(contents, { verified }),
    { spaces: 2 },
  )
}

const getPathToExecutable = (binaryDir: string): string => {
  return path.join(binaryDir, getPlatformExecutable())
}

/**
 * Resolves with an object read from the binary app package.json file.
 * If the file does not exist resolves with null
 */
const getBinaryPkgAsync = async (binaryDir: string): Promise<any> => {
  const pathToPackageJson = getBinaryPkgPath(binaryDir)

  debug('Reading binary package.json from:', pathToPackageJson)

  const exists: boolean = await fs.pathExists(pathToPackageJson)

  if (!exists) {
    return null
  }

  return fs.readJson(pathToPackageJson)
}

const getBinaryPkgVersion = (o: any): any => _.get(o, 'version', null)
const getBinaryElectronVersion = (o: any): any => _.get(o, 'electronVersion', null)
const getBinaryElectronNodeVersion = (o: any): any => _.get(o, 'electronNodeVersion', null)

const stateModule = {
  getPathToExecutable,
  getPlatformExecutable,
  // those names start to sound like Java
  getBinaryElectronNodeVersion,
  getBinaryElectronVersion,
  getBinaryPkgVersion,
  getBinaryVerifiedAsync,
  getBinaryPkgAsync,
  getBinaryPkgPath,
  getBinaryDir,
  getCacheDir,
  clearBinaryStateAsync,
  writeBinaryVerifiedAsync,
  parseRealPlatformBinaryFolderAsync,
  getDistDir,
  getVersionDir,
}

export default stateModule
