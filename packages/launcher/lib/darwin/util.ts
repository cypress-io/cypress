import Debug from 'debug'
import { notInstalledErr } from '../errors'
import execa from 'execa'
import fs from 'fs-extra'
import path from 'path'
import plist from 'plist'

const debugVerbose = Debug('cypress-verbose:launcher:darwin:util')

/** parses Info.plist file from given application and returns a property */
export async function parsePlist (p: string, property: string): Promise<string> {
  const pl = path.join(p, 'Contents', 'Info.plist')

  debugVerbose('reading property file "%s"', pl)

  const failed = (e: Error) => {
    const msg = `Info.plist not found: ${pl}
    ${e.message}`

    debugVerbose('could not read Info.plist %o', { pl, e })
    throw notInstalledErr('', msg)
  }

  try {
    const file = await fs.readFile(pl, 'utf8')
    const val = plist.parse(file)

    return String(val[property]) // explicitly convert value to String type
  } catch (err) {
    return failed(err) // to make TS compiler happy
  }
}

/** uses mdfind to find app using Ma app id like 'com.google.Chrome.canary' */
export async function mdfind (id: string): Promise<string> {
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

  try {
    const val = await execa(cmd)

    logFound(val.stdout)

    return val.stdout
  } catch (err) {
    return failedToFind()
  }
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
export async function findApp ({ appName, executable, bundleId, versionProperty }: FindAppParams): Promise<AppInfo> {
  debugVerbose('looking for app %s bundle id %s', executable, bundleId)

  const findVersion = async (foundPath: string) => {
    const version = await parsePlist(foundPath, versionProperty)

    debugVerbose('got plist: %o', { foundPath, version })

    return {
      path: path.join(foundPath, executable),
      version,
    }
  }

  const tryMdFind = async () => {
    const foundPath = await mdfind(bundleId)

    return findVersion(foundPath)
  }

  const tryFullApplicationFind = () => {
    const applicationPath = formApplicationPath(appName)

    debugVerbose('looking for application %s', applicationPath)

    return findVersion(applicationPath)
  }

  try {
    const val = await tryMdFind()

    return val
  } catch (err) {
    return tryFullApplicationFind()
  }
}
