_ = require("lodash")
debug = require("debug")("cypress:server:saved_state")
FileUtil = require("./util/file")
appData = require("./util/app_data")
savedStateUtil = require("./util/saved_state")

stateFiles = {}

whitelist = """
  appWidth
  appHeight
  appX
  appY
  isAppDevToolsOpen
  browserWidth
  browserHeight
  browserX
  browserY
  isBrowserDevToolsOpen
  reporterWidth
  showedOnBoardingModal
""".trim().split(/\s+/)

normalizeAndWhitelistSet = (set, key, value) ->
  valueObject = if _.isString(key)
    tmp = {}
    tmp[key] = value
    tmp
  else
    key

  invalidKeys = _.filter _.keys(valueObject), (key) ->
    not _.includes(whitelist, key)

  if invalidKeys.length
    console.error("WARNING: attempted to save state for non-whitelisted key(s): #{invalidKeys.join(', ')}. All keys must be whitelisted in server/lib/saved_state.coffee")

  set(_.pick(valueObject, whitelist))

findSavedSate = (projectRoot, isTextTerminal) ->
  if isTextTerminal
    debug("noop saved state")
    return Promise.resolve(FileUtil.noopFile)

  savedStateUtil.formStatePath(projectRoot)
  .then (statePath) ->
    fullStatePath = appData.projectsPath(statePath)
    debug('full state path %s', fullStatePath)
    return stateFiles[fullStatePath] if stateFiles[fullStatePath]

    debug('making new state file around %s', fullStatePath)
    stateFile = new FileUtil({
      path: fullStatePath
    })

    stateFile.set = _.wrap(stateFile.set.bind(stateFile), normalizeAndWhitelistSet)

    stateFiles[fullStatePath] = stateFile
    stateFile

module.exports = findSavedSate
