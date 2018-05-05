FileUtil = require("./util/file")
appData = require("./util/app_data")
log = require('./log')
savedStateUtil = require("./util/saved_state")

# store file utils by the project path
# to prevent race conditions and for simple testing
stateFiles = {}

# TESTING

# In order to stub state access, create a state object *first* using project's
# path, then make the project instance. Control the stabbed instance in the test
#
# example
#   savedState = require('./saved_state')
#   state = savedState 'foo/bar'
#   project = Project 'foo/bar'
#   stub(state, 'get').returns(Promise.resolve({width: 200}))
#   project.open().then(project.state).then(state)
#   state should have width = 200

# async promise-returning function
findSavedSate = (projectRoot) ->
  savedStateUtil.formStatePath(projectRoot)
  .then (statePath) ->
    fullStatePath = appData.projectsPath(statePath)
    log('full state path %s', fullStatePath)
    return stateFiles[fullStatePath] if stateFiles[fullStatePath]

    log('making new state file around %s', fullStatePath)
    stateFile = new FileUtil({
      path: fullStatePath
    })
    stateFiles[fullStatePath] = stateFile
    stateFile

module.exports = findSavedSate
