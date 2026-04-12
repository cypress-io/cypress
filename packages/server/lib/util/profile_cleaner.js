const path = require('path')
const debug = require('debug')('cypress:server:profilecleaner')
const { fs } = require('./fs')
const glob = require('./glob')
const findProcess = require('./find_process')

const includesCypress = (str) => {
  return typeof str === 'string' && str.toLowerCase().includes('cypress')
}

const isCypressProcess = (process) => {
  debug('got process %o', process)

  return [process.cmd, process.name].some(includesCypress)
}

const getPidFromFolder = (folder, pidPrefix) => {
  return Number(
    path.basename(folder).replace(pidPrefix, ''),
  )
}

const folderWithPid = (pidPrefix) => {
  return (folder) => {
    return {
      folder,
      pid: getPidFromFolder(folder, pidPrefix),
    }
  }
}

// find all the pids not associated to a cypress process
const inactivePids = ({ pid }) => {
  debug('finding process by pid:', pid)

  return findProcess.byPid(pid)
  .then((processes) => {
    // return true if no processes are a cypress process
    return !processes.some(isCypressProcess)
  })
}

const removeProfile = ({ pid, folder }) => {
  debug('removing old profile %o', { pid, folder })

  return fs.removeAsync(folder)
}

const removeMatch = (match) => {
  debug('removed root profile object %o', { path: match })

  return fs.removeAsync(match)
}

const removeInactiveByPid = async (pathToProfiles, pidPrefix) => {
  const pattern = path.join(pathToProfiles, `${pidPrefix}*`)
  const folders = await glob(pattern, { absolute: true })

  debug('found %d profile folders: %o', folders.length, folders)

  const withPid = folders.map(folderWithPid(pidPrefix))
  const toRemove = await Promise.all(
    withPid.map((item) =>
      inactivePids(item).then((inactive) => (inactive ? item : null)),
    ),
  )
  const items = toRemove.filter(Boolean)

  return Promise.all(items.map(removeProfile))
}

const removeRootProfile = async (pathToProfiles, ignore) => {
  const pattern = path.join(pathToProfiles, '*')

  try {
    const matches = await glob(pattern, { absolute: true, dot: true, ignore })

    debug('found %d root level profile matches: %o', matches.length, matches)

    await Promise.all(matches.map(removeMatch))
  } catch {
    return null // swallow errors
  }
}

module.exports = {
  inactivePids,

  isCypressProcess,

  getPidFromFolder,

  removeRootProfile,

  removeInactiveByPid,
}
