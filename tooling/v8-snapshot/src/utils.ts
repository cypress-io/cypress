import { blueBright, gray, green, yellow } from 'ansi-colors'
import fs from 'fs'
import crypto from 'crypto'
import path from 'path'
import { binary } from './snapbuild/snapbuild'
import resolveFrom from 'resolve-from'

import debug from 'debug'
const logDebug = debug('cypress:snapgen:debug')

/**
 * Gets the path of the Go bundler binary to use, either from the provided
 * `SNAPSHOT_BUNDLER` env var or the installed binary.
 *
 * @category snapshot
 */
export function getBundlerPath () {
  if (process.env.SNAPSHOT_BUNDLER != null) {
    const bundler = path.resolve(process.env.SNAPSHOT_BUNDLER)

    logDebug('Using provided SNAPSHOT_BUNDLER (%s)', bundler)

    return bundler
  }

  logDebug('Using installed SNAPSHOT_BUNDLER (%s)', binary)

  return binary
}

function canAccessSync (p: string) {
  try {
    fs.accessSync(p)

    return true
  } catch (_) {
    return false
  }
}

/**
 * Hashes the provided buffer using the Node.js `crypto` module
 * @category utils
 */
export function createHash (s: Buffer) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

/**
 * Hashes the content of the provided file using the Node.js `crypto` module
 * @category utils
 */
export async function createHashForFile (p: string) {
  const contents = await tryReadFile(p)

  if (contents == null) throw new Error(`Cannot obtain hash for '${p}`)

  return createHash(contents)
}

/**
 * Derives a proper name for a bundle from the given hash.
 * @category utils
 */
export function bundleFileNameFromHash (hash: string) {
  return `bundle.${hash}.js`
}

/**
 * Determines if the given path is accessible to the current user.
 * @category utils
 */
export async function canAccess (p: string) {
  try {
    await fs.promises.access(p)

    return true
  } catch (_) {
    return false
  }
}

/**
 * Tries to read the given file and returns it's contents if it succeeds.
 * @category utils
 */
export async function tryReadFile (p: string): Promise<Buffer | undefined> {
  if (!(await canAccess(p))) return

  return fs.promises.readFile(p)
}

/**
 * Removes the file if it exists and is accessible to the current user.
 * @category utils
 */
export async function tryRemoveFile (p: string) {
  if (!(await canAccess(p))) {
    return new Error(`Cannot access ${p} in order to delete it`)
  }

  try {
    await fs.promises.unlink(p)
  } catch (err) {
    return err
  }
}

/**
 * Determines if the hash of the given string matches the provided hash.
 * It includes the hash of the provided string in the result.
 *
 * @param p the string to check
 * @param hash the hash to check against
 * @category utils
 */
export async function matchFileHash (p: string, hash: string) {
  const contents = await tryReadFile(p)

  if (contents == null) throw new Error(`Cannot obtain hash for '${p}`)

  const currentHash = createHash(contents)

  return { hash: currentHash, match: hash === currentHash }
}

/**
 * Ensures that the given directory exists by creating it recursively when necessary.
 *
 * @throws Error if the path already exists and is not a directory
 * @category utils
 */
export function ensureDirSync (dir: string) {
  if (!canAccessSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })

    return
  }

  // dir already exists, make sure it isn't a file
  const stat = fs.statSync(dir)

  if (!stat.isDirectory()) {
    throw new Error(`'${dir}' is not a directory`)
  }
}

/**
 * Checks that the provided path exists and is a file.
 * @throws Error if it isn't found or isn't a file.
 * @category utils
 */
export function checkFileSync (p: string) {
  if (!canAccessSync(p)) throw new Error(`Unable to find '${p}'`)

  const stat = fs.statSync(p)

  if (!stat.isFile()) throw new Error(`${p} is not a file`)
}

/**
 * Checks that the provided path exists and is a directory.
 * @throws Error if it isn't found or isn't a directory.
 * @category utils
 */
export function checkDirSync (p: string) {
  if (!canAccessSync(p)) throw new Error(`Unable to find '${p}'`)

  const stat = fs.statSync(p)

  if (!stat.isDirectory()) throw new Error(`${p} is not a directory`)
}

/**
 * Determines if the given path exists and is a file.
 * @category utils
 */
export function fileExistsSync (p: string) {
  try {
    checkFileSync(p)

    return true
  } catch (_) {
    return false
  }
}

/**
 * Attempts to delete the file at the provided path.
 * @return Error if the file cannot be accessed or cannot be removed
 * @category utils
 */
export function tryRemoveFileSync (p: string) {
  if (!fileExistsSync(p)) {
    return new Error(`Cannot access ${p} in order to delete it`)
  }

  try {
    fs.unlinkSync(p)
  } catch (err) {
    return err
  }
}

/**
 * Resolves the version of the electron that would be used from the provided `root`.
 * This is needed in order to use a compatible `mksnapshot` version
 * {@link https://github.com/thlorenz/mksnapshot} when creating the snapshot from the
 * snapshot script.
 * @category snapshot
 */
export function resolveElectronVersion (root: string): string {
  const electron = resolveFrom(root, 'electron')

  return require(path.join(path.dirname(electron), 'package.json')).version
}

/**
 * Determines the name to which the existing electron snapshot should be saved
 * before replacing it with the enhanced version.
 * @category snapshot
 */
export function backupName (orig: string) {
  const file = path.basename(orig)
  const ext = path.extname(orig)
  const extLen = ext.length

  return `${file.slice(0, -extLen)}.orig${ext}`
}

/**
 * Normalizes the given path to have forward slashes at all times.
 * This is used to resolve modules from the snapshot as they are always stored
 * with forward slashes there.
 * @category loader
 */
export const forwardSlash =
  path.sep === path.posix.sep
    ? (p: string) => p
    : (p: string) => p.replace(/(\\)+/g, '/')

/**
 * Determines the path where the electron binary is installed provided the project root.
 * @category snapshot
 */
export function installedElectronResourcesFilePath (
  root: string,
  electronFile: string,
) {
  const electron = path.dirname(resolveFrom(root, 'electron'))
  let location

  switch (process.platform) {
    case 'darwin': {
      location =
        'dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources'

      break
    }
    case 'linux':
    case 'openbsd':
    case 'sunos':
    case 'win32':
    case 'cygwin':
    case 'netbsd': {
      location = 'dist'
      break
    }

    default: {
      throw new Error(`Platform not supported ${process.platform}`)
    }
  }

  const snapshotLocation = path.join(electron, location)

  return path.join(snapshotLocation, electronFile)
}

// at Object.__commonJS../node_modules/mute-stream/mute.js (/Volumes/d/dev/cy/perf-tr1/v8-snapshot/example-multi/cache/snapshot.js:10555:43)
const commonJsModuleRx = /(at Object.__commonJS\.)([^(]+)([^ :]+) *:(\d+)(.+)/

/**
 * Pretty prints errors related to module's being included in the snapshot.
 * @category snapshot
 */
export function prettyPrintError (err: Error, baseDirPath: string) {
  if (
    !(
      err.stack != null &&
      (err.message.includes('Cannot require module') ||
        commonJsModuleRx.test(err.stack))
    )
  ) {
    // eslint-disable-next-line no-console
    console.error(err)

    return
  }

  // eslint-disable-next-line no-console
  console.error(err.message)
  const frames = err.stack.split('\n')

  const locations: string[] = []
  const prettyFrames: string[] = []

  for (const frame of frames) {
    const match = frame.match(commonJsModuleRx)

    if (match == null) {
      prettyFrames.push(frame)
      continue
    }

    const parts = {
      atObject: match[1],
      requireString: match[2].trimEnd(),
      snapshotPath: match[3],
      lineno: match[4],
      rest: match[5],
    }

    prettyFrames.push(
      `${gray(parts.atObject)} ${green(parts.requireString)}` +
        `${gray(parts.snapshotPath)}` +
        `:${blueBright(parts.lineno)}${gray(')')}`,
    )

    const fullPath = path.resolve(baseDirPath, parts.requireString)

    locations.push(
      `${parts.requireString} ${gray(`at snapshot:${ parts.lineno}`)} (${gray(
        fullPath,
      )})`,
    )
  }
  // eslint-disable-next-line no-console
  console.error(prettyFrames.join('\n'))

  // eslint-disable-next-line no-console
  console.error(yellow('\nRequire Definitions Stack:'))
  // eslint-disable-next-line no-console
  console.error('  %s', green(locations.join('\n  ')))
}
