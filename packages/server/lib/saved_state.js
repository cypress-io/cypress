const _ = require('lodash')
const debug = require('debug')('cypress:server:saved_state')
const path = require('path')
const Promise = require('bluebird')
const appData = require('./util/app_data')
const cwd = require('./cwd')
const FileUtil = require('./util/file')
const { fs } = require('./util/fs')

const stateFiles = {}

// TODO: remove `showedOnBoardingModal` from this list - it is only included so that misleading `allowed` are not thrown
// now that it has been removed from use
const allowed = `
appWidth
appHeight
appX
appY
autoScrollingEnabled
browserWidth
browserHeight
browserX
browserY
isAppDevToolsOpen
isBrowserDevToolsOpen
reporterWidth
specListWidth
showedNewProjectBanner
firstOpenedCypress
showedStudioModal
preferredOpener
ctReporterWidth
ctIsSpecsListOpen
ctSpecListWidth
firstOpened
lastOpened
promptsShown
`.trim().split(/\s+/)

const formStatePath = (projectRoot) => {
  return Promise.try(() => {
    debug('making saved state from %s', cwd())

    if (projectRoot) {
      debug('for project path %s', projectRoot)

      return projectRoot
    }

    debug('missing project path, looking for project here')

    const cypressJsonPath = cwd('cypress.json')

    return fs.pathExistsAsync(cypressJsonPath)
    .then((found) => {
      if (found) {
        debug('found cypress file %s', cypressJsonPath)
        projectRoot = cwd()
      }

      return projectRoot
    })
  }).then((projectRoot) => {
    const fileName = 'state.json'

    if (projectRoot) {
      debug(`state path for project ${projectRoot}`)

      return path.join(appData.toHashName(projectRoot), fileName)
    }

    debug('state path for global mode')

    return path.join('__global__', fileName)
  })
}

const normalizeAndAllowSet = (set, key, value) => {
  const valueObject = (() => {
    if (_.isString(key)) {
      const tmp = {}

      tmp[key] = value

      return tmp
    }

    return key
  })()

  const invalidKeys = _.filter(_.keys(valueObject), (key) => {
    return !_.includes(allowed, key)
  })

  if (invalidKeys.length) {
    // eslint-disable-next-line no-console
    console.error(`WARNING: attempted to save state for non-allowed key(s): ${invalidKeys.join(', ')}. All keys must be allowed in server/lib/saved_state.js`)
  }

  return set(_.pick(valueObject, allowed))
}

const create = (projectRoot, isTextTerminal) => {
  if (isTextTerminal) {
    debug('noop saved state')

    return Promise.resolve(FileUtil.noopFile)
  }

  return formStatePath(projectRoot)
  .then((statePath) => {
    const fullStatePath = appData.projectsPath(statePath)

    debug('full state path %s', fullStatePath)
    if (stateFiles[fullStatePath]) {
      return stateFiles[fullStatePath]
    }

    debug('making new state file around %s', fullStatePath)
    const stateFile = new FileUtil({
      path: fullStatePath,
    })

    stateFile.set = _.wrap(stateFile.set.bind(stateFile), normalizeAndAllowSet)

    stateFiles[fullStatePath] = stateFile

    return stateFile
  })
}

module.exports = {
  create,
  formStatePath,
}
