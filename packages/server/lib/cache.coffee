_          = require("lodash")
path       = require("path")
Promise    = require("bluebird")
fs         = require("./util/fs")
appData    = require("./util/app_data")
FileUtil   = require("./util/file")
logger     = require("./logger")

fileUtil = new FileUtil({
  path: appData.path("cache")
})

convertProjectsToArray = (obj) ->
  ## if our project structure is not
  ## an array then its legacy and we
  ## need to convert it
  if not _.isArray(obj.PROJECTS)
    obj.PROJECTS = _.chain(obj.PROJECTS).values().map("PATH").compact().value()
    obj

renameSessionToken = (obj) ->
  if obj.USER and (st = obj.USER.session_token)
    delete obj.USER.session_token
    obj.USER.sessionToken = st
    obj

module.exports = {
  path: fileUtil.path

  defaults: ->
    {
      USER: {}
      PROJECTS: []
    }

  _applyRewriteRules: (obj = {}) ->
    _.reduce [convertProjectsToArray, renameSessionToken], (memo, fn) ->
      if ret = fn(memo)
        return ret
      else
        return memo
    , _.cloneDeep(obj)

  read: ->
    fileUtil.get().then (contents) =>
      _.defaults(contents, @defaults())

  write: (obj = {}) ->
    logger.info("writing to .cy cache", {cache: obj})

    fileUtil.set(obj).return(obj)

  _getProjects: (tx) ->
    tx.get("PROJECTS", [])

  _removeProjects: (tx, projects, paths) ->
    ## normalize paths in array
    projects = _.without(projects, [].concat(paths)...)

    tx.set({PROJECTS: projects})

  getProjectRoots: ->
    fileUtil.transaction (tx) =>
      @_getProjects(tx).then (projects) =>
        pathsToRemove = Promise.reduce projects, (memo, path) ->
          fs.statAsync(path)
          .catch ->
            memo.push(path)
          .return(memo)
        , []

        pathsToRemove.then (removedPaths) =>
          @_removeProjects(tx, projects, removedPaths)
        .then =>
          @_getProjects(tx)

  removeProject: (path) ->
    fileUtil.transaction (tx) =>
      @_getProjects(tx).then (projects) =>
        @_removeProjects(tx, projects, path)

  insertProject: (path) ->
    fileUtil.transaction (tx) =>
      @_getProjects(tx).then (projects) =>
        ## projects are sorted by most recently used, so add a project to
        ## the start or move it to the start if it already exists
        existingIndex = _.findIndex projects, (project) -> project is path
        if existingIndex > -1
          projects.splice(existingIndex, 1)

        projects.unshift(path)
        tx.set("PROJECTS", projects)

  getUser: ->
    logger.info "getting user"

    fileUtil.get("USER", {})

  setUser: (user) ->
    logger.info("setting user", {user: user})

    fileUtil.set({USER: user})

  removeUser: ->
    fileUtil.set({USER: {}})

  remove: ->
    fileUtil.remove()

  ## for testing purposes

  __get: fileUtil.get.bind(fileUtil)

  __removeSync: ->
    fileUtil._cache = {}
    fs.removeSync(@path)
}
