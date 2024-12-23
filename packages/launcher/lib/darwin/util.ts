import Debug from 'debug'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as plist from 'plist'

const debugVerbose = Debug('cypress-verbose:launcher:darwin:util')

/** parses Info.plist file from given application and returns a property */
export function parsePlist (p: string, property: string): Promise<string> {
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
  .then((val) => val[property])
  .then(String) // explicitly convert value to String type
  .catch(failed) // to make TS compiler happy
}

/** uses mdfind to find app using Ma app id like 'com.google.Chrome.canary' */
export function mdfind (id: string): Promise<string> {
  const cmd = `mdfind 'kMDItemCFBundleIdentifier=="${id}"' | head -1`

  debugVerbose('looking for bundle id %s using command: %s', id, cmd)

  const logFound = (str: string) => {
    debugVerbose('found %s at %s', id, str)

    return str
  }

  const failedToFind = () => {
    debugVerbose('could not find %s', id)
    throw notInstalledErr(id)
  }

  return utils.execa(cmd)
  .then((val) => {
    return val.stdout
  })
  .then((val) => {
    logFound(val)

    return val
  })
  .catch(failedToFind)
}

export type AppInfo = {
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

/** finds an application and its version */
export function findApp ({ appName, executable, bundleId, versionProperty }: FindAppParams): Promise<AppInfo> {
  debugVerbose('looking for app %s bundle id %s', executable, bundleId)

  const findVersion = (foundPath: string) => {
    return parsePlist(foundPath, versionProperty).then((version) => {
      debugVerbose('got plist: %o', { foundPath, version })

      return {
        path: path.join(foundPath, executable),
        version,
      }
    })
  }

  const tryMdFind = () => {
    return mdfind(bundleId).then(findVersion)
  }

  const tryFullApplicationFind = () => {
    const applicationPath = formApplicationPath(appName)

    debugVerbose('looking for application %s', applicationPath)

    return findVersion(applicationPath)
  }

  return tryMdFind().catch(tryFullApplicationFind)
}
