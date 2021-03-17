const _ = require('lodash')
const path = require('path')
const debug = require('debug')('cypress:server:profilecleaner')
const { fs } = require('./fs')
const glob = require('./glob')
const findProcess = require('./find_process')

const includesCypress = (str) => {
  return _.chain(str).lowerCase().includes('cypress').value()
}

const isCypressProcess = (process) => {
  debug('got process %o', process)

  return _.some([process.cmd, process.name], includesCypress)
}

const getPidFromFolder = (folder, pidPrefix) => {
  return _.toNumber(
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
    return !_.some(processes, isCypressProcess)
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

const removeInactiveByPid = (pathToProfiles, pidPrefix) => {
  const pattern = path.join(pathToProfiles, `${pidPrefix}*`)

  return glob(pattern, { absolute: true })
  .tap((folders) => {
    debug('found %d profile folders: %o', folders.length, folders)
  })
  .map(folderWithPid(pidPrefix))
  .filter(inactivePids)
  .map(removeProfile)
}

const removeRootProfile = (pathToProfiles, ignore) => {
  const pattern = path.join(pathToProfiles, '*')

  return glob(pattern, { absolute: true, dot: true, ignore })
  .tap((matches) => {
    debug('found %d root level profile matches: %o', matches.length, matches)
  })
  .map(removeMatch)
  .catchReturn(null) // swallow errors
}

module.exports = {
  inactivePids,

  isCypressProcess,

  getPidFromFolder,

  removeRootProfile,

  removeInactiveByPid,
}
