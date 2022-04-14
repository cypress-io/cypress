import { log } from '../log'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as plist from 'plist'
import * as semver from 'semver'
import type { FoundBrowser } from '@packages/types'
import * as findSystemNode from '@packages/server/lib/util/find_system_node'

/** parses Info.plist file from given application and returns a property */
export function parsePlist (p: string, property: string): Promise<string> {
  const pl = path.join(p, 'Contents', 'Info.plist')

  log('reading property file "%s"', pl)

  const failed = (e: Error) => {
    const msg = `Info.plist not found: ${pl}
    ${e.message}`

    log('could not read Info.plist %o', { pl, e })
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

  log('looking for bundle id %s using command: %s', id, cmd)

  const logFound = (str: string) => {
    log('found %s at %s', id, str)

    return str
  }

  const failedToFind = () => {
    log('could not find %s', id)
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
  appName: string
  executable: string
  appId: string
  versionProperty: string
}

function formApplicationPath (appName: string) {
  return path.join('/Applications', appName)
}

/** finds an application and its version */
export function findApp ({ appName, executable, appId, versionProperty }: FindAppParams): Promise<AppInfo> {
  log('looking for app %s id %s', executable, appId)

  const findVersion = (foundPath: string) => {
    return parsePlist(foundPath, versionProperty).then((version) => {
      log('got plist: %o', { foundPath, version })

      return {
        path: path.join(foundPath, executable),
        version,
      }
    })
  }

  const tryMdFind = () => {
    return mdfind(appId).then(findVersion)
  }

  const tryFullApplicationFind = () => {
    const applicationPath = formApplicationPath(appName)

    log('looking for application %s', applicationPath)

    return findVersion(applicationPath)
  }

  return tryMdFind().catch(tryFullApplicationFind)
}

export function needsDarwinWorkaround (): boolean {
  return os.platform() === 'darwin' && semver.gte(os.release(), '20.0.0')
}

export async function darwinDetectionWorkaround (): Promise<FoundBrowser[]> {
  const nodePath = await findSystemNode.findNodeInFullPath()
  let args = ['./detection-workaround.js']

  if (process.env.CYPRESS_INTERNAL_ENV === 'development') {
    args = ['-r', '@packages/ts/register.js', './detection-workaround.ts']
  }

  const { stdout } = await utils.execa(nodePath, args, { cwd: __dirname })

  return JSON.parse(stdout)
}
