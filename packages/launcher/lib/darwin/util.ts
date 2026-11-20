import Debug from 'debug'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'
import fs from 'fs-extra'
import path from 'path'
import plist from 'plist'

const debugVerbose = Debug('cypress-verbose:launcher:darwin:util')

/** parses Info.plist file from given application and returns a property */
function parsePlist (p: string, property: string): Promise<string> {
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
  .then((val) => {
    if (val[property] === undefined || val[property] === null) {
      throw new Error(`property "${property}" not found`)
    }

    return String(val[property]) // explicitly convert value to String type
  })
  .catch(failed) // to make TS compiler happy
}

/** uses mdfind to find apps using a Mac app id like 'com.google.Chrome.canary' */
function mdfind (id: string): Promise<string[]> {
  // pass the query as an argument: execa does not use a shell, so a piped
  // command string would be treated as a program name and never run
  const args = [`kMDItemCFBundleIdentifier=="${id}"`]

  debugVerbose('looking for bundle id %s using command: mdfind %o', id, args)

  const logFound = (paths: string[]) => {
    debugVerbose('found %s at %o', id, paths)

    return paths
  }

  const failedToFind = () => {
    debugVerbose('could not find %s', id)
    throw notInstalledErr(id)
  }

  return utils.execa('mdfind', args)
  .then((val) => {
    const paths = val.stdout
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

    if (paths.length === 0) {
      return failedToFind()
    }

    return logFound(paths)
  })
  .catch(failedToFind)
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
    return mdfind(bundleId)
    .then((paths) => {
      // prefer applications installed directly in /Applications, then keep the
      // remaining results in the order mdfind returned them
      const sortedPaths = [
        ...paths.filter((p) => path.dirname(p) === '/Applications'),
        ...paths.filter((p) => path.dirname(p) !== '/Applications'),
      ]

      const tryNextPath = (index: number): Promise<AppInfo> => {
        if (index >= sortedPaths.length) {
          debugVerbose('could not find %s in any of %o', bundleId, sortedPaths)

          return Promise.reject(notInstalledErr(bundleId))
        }

        return findVersion(sortedPaths[index]).catch((err) => {
          debugVerbose('could not get plist for %s at %s, trying next result %o', bundleId, sortedPaths[index], err)

          return tryNextPath(index + 1)
        })
      }

      return tryNextPath(0)
    })
  }

  const tryFullApplicationFind = () => {
    const applicationPath = formApplicationPath(appName)

    debugVerbose('looking for application %s', applicationPath)

    return findVersion(applicationPath)
  }

  return tryMdFind().catch(tryFullApplicationFind)
}
