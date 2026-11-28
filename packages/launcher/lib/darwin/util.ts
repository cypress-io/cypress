import Debug from 'debug'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'
import fs from 'fs-extra'
import path from 'path'
import plist from 'plist'

const debugVerbose = Debug('cypress-verbose:launcher:darwin:util')

// a stuck Spotlight index must not block browser detection
const MDFIND_TIMEOUT_MS = 3000

/** parses Info.plist file from given application and returns a property, or undefined when the plist lacks it */
function parsePlist (p: string, property: string): Promise<string | undefined> {
  const pl = path.join(p, 'Contents', 'Info.plist')

  debugVerbose('reading property file "%s"', pl)

  const failed = (e: Error) => {
    const msg = `Info.plist not found: ${pl}
    ${e.message}`

    debugVerbose('could not read Info.plist %o', { pl, e })
    throw notInstalledErr('', msg)
  }

  return fs
  .readFile(pl, 'utf8')
  .then(plist.parse)
  .catch(failed)
  .then((val) => {
    if (val[property] === undefined || val[property] === null) {
      return undefined
    }

    return String(val[property]) // explicitly convert value to String type
  })
}

/** uses mdfind to find apps using a Mac app id like 'com.google.Chrome.canary', resolving to [] when it finds none */
function mdfind (id: string): Promise<string[]> {
  // execa does not use a shell, so the query is passed as one argument
  const args = [`kMDItemCFBundleIdentifier=="${id}"`]

  debugVerbose('looking for bundle id %s using command: mdfind %o', id, args)

  return utils.execa('mdfind', args, { timeout: MDFIND_TIMEOUT_MS })
  .then((val) => {
    const paths = val.stdout
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

    debugVerbose('found %s at %o', id, paths)

    return paths
  }, (err) => {
    debugVerbose('could not find %s %o', id, err)

    return []
  })
}

type AppInfo = {
  path: string
  version: string
}

export type FindAppParams = {
  // The name of the application (e.g. 'Google Chrome.app')
  appName: string
  // The path to the executable within the application (e.g. 'Contents/MacOS/Google Chrome')
  executable: string
  // The CFBundleIdentifier in the Info.plist (e.g. 'com.google.Chrome')
  bundleId: string
  // The key from the Info.plist to find the version (e.g. 'KSVersion')
  versionProperty: string
}

function formApplicationPath (appName: string) {
  return path.join('/Applications', appName)
}

const isInApplications = (p: string) => path.dirname(p) === '/Applications'

// copies in the Trash, on mounted disk images or in caches are not installs the user can launch
const isIgnoredPath = (p: string) => {
  return p.includes('/.Trash/') || p.startsWith('/Volumes/') || p.includes('/Library/Caches/')
}

/** finds an application and its version */
export async function findApp ({ appName, executable, bundleId, versionProperty }: FindAppParams): Promise<AppInfo> {
  debugVerbose('looking for app %s bundle id %s', executable, bundleId)

  const findVersion = async (foundPath: string): Promise<AppInfo> => {
    const version = await parsePlist(foundPath, versionProperty)

    debugVerbose('got plist: %o', { foundPath, version })

    // a copy elsewhere without a version is skipped, but one in /Applications is still listed
    if (version === undefined && !isInApplications(foundPath)) {
      throw notInstalledErr('', `property "${versionProperty}" not found in ${path.join(foundPath, 'Contents', 'Info.plist')}`)
    }

    return {
      path: path.join(foundPath, executable),
      version: String(version),
    }
  }

  const applicationPath = formApplicationPath(appName)
  const foundPaths = (await mdfind(bundleId)).filter((p) => !isIgnoredPath(p))

  // try copies directly in /Applications first, then the elsewhere copies in a stable order
  const candidates = Array.from(new Set([
    ...foundPaths.filter(isInApplications),
    applicationPath,
    ...foundPaths.filter((p) => !isInApplications(p)).sort(),
  ]))

  let applicationPathError: unknown

  for (const candidate of candidates) {
    try {
      return await findVersion(candidate)
    } catch (err) {
      debugVerbose('could not use %s for %s %o', candidate, bundleId, err)

      if (candidate === applicationPath) {
        applicationPathError = err
      }
    }
  }

  throw applicationPathError
}
