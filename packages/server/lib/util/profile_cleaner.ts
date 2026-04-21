import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import { fs } from './fs'
import { globAsync as glob } from './glob'
import { byPid as findProcessByPid } from './find_process'

const debug = Debug('cypress:server:profilecleaner')

interface ProcessInfo {
  pid: number
  cmd: string
  name: string
}

interface FolderWithPid {
  folder: string
  pid: number
}

const includesCypress = (str: string) => {
  return _.chain(str).lowerCase().includes('cypress').value()
}

export const isCypressProcess = (process: ProcessInfo) => {
  debug('got process %o', process)

  return _.some([process.cmd, process.name], includesCypress)
}

export const getPidFromFolder = (folder: string, pidPrefix: string) => {
  return _.toNumber(
    path.basename(folder).replace(pidPrefix, ''),
  )
}

const folderWithPid = (pidPrefix: string) => {
  return (folder: string): FolderWithPid => {
    return {
      folder,
      pid: getPidFromFolder(folder, pidPrefix),
    }
  }
}

// find all the pids not associated to a cypress process
export const inactivePids = ({ pid }: { pid: number }) => {
  debug('finding process by pid:', pid)

  return findProcessByPid(pid)
  .then((processes) => {
    // return true if no processes are a cypress process
    return !_.some(processes, isCypressProcess)
  })
}

const removeProfile = ({ pid, folder }: FolderWithPid) => {
  debug('removing old profile %o', { pid, folder })

  return fs.removeAsync(folder)
}

const removeMatch = (match: string) => {
  debug('removed root profile object %o', { path: match })

  return fs.removeAsync(match)
}

export const removeInactiveByPid = async (pathToProfiles: string, pidPrefix: string) => {
  const pattern = path.join(pathToProfiles, `${pidPrefix}*`)
  const folders = await glob(pattern, { absolute: true })

  debug('found %d profile folders: %o', folders.length, folders)

  const withPid = folders.map(folderWithPid(pidPrefix))
  const toRemove = await Promise.all(
    withPid.map((item) =>
      inactivePids(item).then((inactive) => (inactive ? item : null)),
    ),
  )
  const items = toRemove.filter((item): item is FolderWithPid => item !== null)

  return Promise.all(items.map(removeProfile))
}

export const removeRootProfile = async (pathToProfiles: string, ignore?: string[]): Promise<void> => {
  const pattern = path.join(pathToProfiles, '*')

  try {
    const matches = await glob(pattern, { absolute: true, dot: true, ignore })

    debug('found %d root level profile matches: %o', matches.length, matches)

    await Promise.all(matches.map(removeMatch))
  } catch {
    // swallow errors
    return undefined
  }
}
