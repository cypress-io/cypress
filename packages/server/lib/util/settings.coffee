_        = require("lodash")
Promise  = require("bluebird")
path     = require("path")
fs       = require("fs-extra")
errors   = require("../errors")

## TODO:
## think about adding another PSemaphore
## here since we can read + write the
## settings at the same time something else
## is potentially reading it

fs = Promise.promisifyAll(fs)

flattenCypress = (obj) ->
  if cypress = obj.cypress
    return cypress

renameVisitToPageLoad = (obj) ->
  if v = obj.visitTimeout
    obj = _.omit(obj, "visitTimeout")
    obj.pageLoadTimeout = v
    obj

renameCommandTimeout = (obj) ->
  if c = obj.commandTimeout
    obj = _.omit(obj, "commandTimeout")
    obj.defaultCommandTimeout = c
    obj

renameSupportFolder = (obj) ->
  if sf = obj.supportFolder
    obj = _.omit(obj, "supportFolder")
    obj.supportFile = sf
    obj

module.exports =
  _pathToFile: (projectRoot, file) ->
    path.join(projectRoot, file)

  _err: (type, file, err) ->
    e = errors.get(type, file, err)
    e.code = err.code
    e.errno = err.errno
    throw e

  _logReadErr: (file, err) ->
    @_err("ERROR_READING_FILE", file, err)

  _logWriteErr: (file, err) ->
    @_err("ERROR_WRITING_FILE", file, err)

  _write: (file, obj = {}) ->
    fs.outputJsonAsync(file, obj, {spaces: 2})
    .return(obj)
    .catch (err) =>
      @_logWriteErr(file, err)

  _applyRewriteRules: (obj = {}) ->
    _.reduce [flattenCypress, renameVisitToPageLoad, renameCommandTimeout, renameSupportFolder], (memo, fn) ->
      if ret = fn(memo)
        return ret
      else
        return memo
    , _.cloneDeep(obj)

  id: (projectRoot) ->
    file = @_pathToFile(projectRoot, "cypress.json")

    fs.readJsonAsync(file)
    .get("projectId")
    .catch ->
      null

  read: (projectRoot) ->
    file = @_pathToFile(projectRoot, "cypress.json")

    fs.readJsonAsync(file)
    .catch {code: "ENOENT"}, =>
      @_write(file, {})
    .then (json = {}) =>
      changed = @_applyRewriteRules(json)

      ## if our object is unchanged
      ## then just return it
      if _.isEqual(json, changed)
        return json
      else
        ## else write the new reduced obj
        @_write(file, changed)

    .catch (err) =>
      throw err if errors.isCypressErr(err)

      @_logReadErr(file, err)

  readEnv: (projectRoot) ->
    file = @_pathToFile(projectRoot, "cypress.env.json")

    fs.readJsonAsync(file)
    .catch {code: "ENOENT"}, ->
      return {}
    .catch (err) =>
      throw err if errors.isCypressErr(err)

      @_logReadErr(file, err)

  write: (projectRoot, obj = {}) ->
    @read(projectRoot)
    .then (settings) =>
      _.extend settings, obj

      file = @_pathToFile(projectRoot, "cypress.json")

      @_write(file, settings)

  remove: (projectRoot) ->
    fs.unlinkSync @_pathToFile(projectRoot, "cypress.json")

  pathToCypressJson: (projectRoot) ->
    @_pathToFile(projectRoot, "cypress.json")
