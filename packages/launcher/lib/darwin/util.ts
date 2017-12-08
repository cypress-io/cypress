import { log } from '../log'
import { NotInstalledError } from '../types'
import { prop, tap } from 'ramda'
import * as execa from 'execa'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as plist from 'plist'

/** parses Info.plist file from given application and returns a property */
export function parse(p: string, property: string): Promise<string> {
  const pl = path.join(p, 'Contents', 'Info.plist')
  log('reading property file "%s"', pl)

  const failed = (e: Error) => {
    const msg = `Info.plist not found: ${pl}
    ${e.message}`
    const err = new Error(msg) as NotInstalledError
    err.notInstalled = true
    log('could not read Info.plist for %s', pl)
    throw err
  }

  return fs
    .readFile(pl, 'utf8')
    .then(plist.parse)
    .then(prop(property))
    .then(String) // explicitly convert value to String type
    .catch(failed) // to make TS compiler happy
}

/** uses mdfind to find app using Ma app id like 'com.google.Chrome.canary' */
export function mdfind(id: string): Promise<string> {
  const cmd = `mdfind 'kMDItemCFBundleIdentifier=="${id}"' | head -1`
  log('looking for bundle id %s using command: %s', id, cmd)

  const logFound = (str: string) => {
    log('found %s at %s', id, str)
    return str
  }

  const failedToFind = () => {
    log('could not find %s', id)
    const err = new Error(`Browser not installed: ${id}`) as NotInstalledError
    err.notInstalled = true
    throw err
  }

  return execa
    .shell(cmd)
    .then(result => result.stdout)
    .then(tap(logFound))
    .catch(failedToFind)
}

export type AppInfo = {
  path: string
  version: string
}

function formApplicationPath(executable: string) {
  const parts = executable.split('/')
  const name = parts[parts.length - 1]
  const appName = `${name}.app`
  return path.join('/Applications', appName)
}

/** finds an application and its version */
export function findApp(
  executable: string,
  appId: string,
  versionProperty: string
): Promise<AppInfo> {
  log('looking for app %s id %s', executable, appId)

  const findVersion = (foundPath: string) =>
    parse(foundPath, versionProperty).then(version => {
      return {
        path: path.join(foundPath, executable),
        version
      }
    })

  const tryMdFind = () => {
    return mdfind(appId).then(findVersion)
  }

  const tryFullApplicationFind = () => {
    const applicationPath = formApplicationPath(executable)
    log('looking for application %s', applicationPath)
    return findVersion(applicationPath)
  }

  return tryMdFind().catch(tryFullApplicationFind)
}
