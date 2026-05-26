import os from 'os'
import { parse, normalize, join, dirname, relative, basename, isAbsolute } from 'path'
import ospath from 'ospath'
import la from 'lazy-ass'
import Debug from 'debug'
import pkg from '@packages/root'
import { fs } from '../util/fs'
import { getCwd } from '../cwd'
import md5 from 'md5'
import sanitize from 'sanitize-filename'
import replace from 'lodash/replace'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const log = Debug('cypress:server:appdata')

const PRODUCT_NAME = pkg.productName || pkg.name

export const findCommonAncestor = (path1: string, path2: string): string | null => {
  const sep = os.platform() === 'win32' ? '\\' : '/'

  function* commonArrayMembersGenerator (segments1: string[], segments2: string[]) {
    const longer = segments1.length > segments2.length ? [...segments1] : [...segments2]
    const shorter = segments1.length > segments2.length ? segments2 : segments1

    // find when the paths eventually differ.
    for (const pathSegment of shorter) {
      if (pathSegment === longer.shift()) {
        yield pathSegment
      } else {
        break
      }
    }
  }

  return path1 === path2 ? path1
    : parse(path1).root !== parse(path2).root ? null
      : [...commonArrayMembersGenerator(normalize(path1).split(sep), normalize(path2).split(sep))].join(sep)
}

const getElectronAppDataPath = (): string => {
  const OS_DATA_PATH = ospath.data()
  const ELECTRON_APP_DATA_PATH = join(OS_DATA_PATH, PRODUCT_NAME)

  return ELECTRON_APP_DATA_PATH
}

if (!PRODUCT_NAME) {
  throw new Error('Root package is missing name')
}

const getSymlinkType = (): 'junction' | 'dir' => {
  if (os.platform() === 'win32') {
    return 'junction'
  }

  return 'dir'
}

const isProduction = (): boolean => {
  return process.env.CYPRESS_INTERNAL_ENV === 'production'
}

export const toHashName = (projectRoot?: string): string => {
  if (!projectRoot) {
    throw new Error('Missing project path')
  }

  if (!isAbsolute(projectRoot)) {
    throw new Error(`Expected project absolute path, not just a name ${projectRoot}`)
  }

  const name = sanitize(basename(projectRoot))
  const hash = md5(projectRoot)

  return `${name}-${hash}`
}

const modifyFileIfOutsideProjectDirectory = (projectRoot: string, filePath: string): string => {
  /**
   * files that live outside of the project directory
   * do not resolve correctly on Windows as we are trying to resolve the file to the project directory.
   * This issue is only noticeable on windows since the absolute path gets appended to the project bundle
   * path. In Unix based systems, this goes unnoticed because:
   *     /Users/foo/project/nested/hash-bundle/Users/foo/project/file.js
   * is a valid path in Unix, but
   *     C:\\Users\\foo\\project\\nested\\hash-bundleC:\\Users\\foo\\project\\file.js
   * is not a valid path in Windows
   *
   * To resolve this issue, we find the common ancestor directory between the project and file,
   * take the path AFTER the common ancestor directory of the file, and append it to the project bundle directory.
   * Effectively:
   *     C:\\Users\\foo\\project\\nested\\hash-bundleC:\\Users\\foo\\project\\file.js
   * will become
   *     C:\\Users\\foo\\project\\nested\\hash-bundle\\file.js
   * @see https://github.com/cypress-io/cypress/issues/8599
   */

  const relativePath = relative(projectRoot, filePath)
  const isSubDirectory = relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath)

  // if the file does NOT live inside the project directory,
  // find the common ancestor of the project and file to get the file subpath to append to the project bundle directory
  if (!isSubDirectory) {
    const commonDirectoryPath = findCommonAncestor(projectRoot, filePath)

    if (commonDirectoryPath) {
      filePath = replace(filePath, commonDirectoryPath, '')
    }
  }

  return filePath
}

export const getBundledFilePath = (projectRoot: string, filePath: string): string => {
  return projectsPath(toHashName(projectRoot), 'bundles', modifyFileIfOutsideProjectDirectory(projectRoot, filePath))
}

export const ensure = (): Promise<void> => {
  // ensureSymlinkAsync lstats its src, so the appData dir must exist
  // before symlink() runs — these can't be parallelized.
  const ensureInner = (): Promise<void> => {
    return removeSymlink()
    .then(() => fs.ensureDirAsync(path()))
    .then(() => (!isProduction() ? symlink() : undefined))
  }

  // try twice to ensure the dir
  return ensureInner()
  .catch((err) => delay(100).then(() => { throw err }))
  .catch(ensureInner)
}

export const symlink = (): Promise<void> => {
  const src = dirname(path())
  const dest = getCwd('.cy')

  log('symlink folder from %s to %s', src, dest)
  const symlinkType = getSymlinkType()

  return fs.ensureSymlinkAsync(src, dest, symlinkType)
}

export const removeSymlink = (): Promise<void> => {
  return fs.removeAsync(getCwd('.cy')).catch(() => {})
}

export const path = (...paths: string[]): string => {
  const { env } = process

  la(typeof env.CYPRESS_INTERNAL_ENV === 'string' && Boolean(env.CYPRESS_INTERNAL_ENV),
    'expected CYPRESS_INTERNAL_ENV, found', env.CYPRESS_INTERNAL_ENV)

  // allow overriding the app_data folder
  const internalEnv = env.CYPRESS_INTERNAL_ENV as string
  let folder: string = env.CYPRESS_CONFIG_ENV || internalEnv

  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
    folder = `${folder}-e2e-test`
  }

  const p = join(getElectronAppDataPath(), 'cy', folder, ...paths)

  log('path: %s', p)

  return p
}

export const electronPartitionsPath = (): string => {
  return join(getElectronAppDataPath(), 'Partitions')
}

export const projectsPath = (...paths: string[]): string => {
  return path('projects', ...paths)
}

export const remove = (): Promise<[void, void]> => {
  return Promise.all([
    fs.removeAsync(path()),
    removeSymlink(),
  ])
}
