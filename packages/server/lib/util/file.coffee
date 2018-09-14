_ = require("lodash")
os = require("os")
md5 = require("md5")
path = require("path")
debug = require('debug')('cypress:server:file')
Queue = require("p-queue")
Promise = require("bluebird")
lockFile = Promise.promisifyAll(require("lockfile"))
fs = require("./fs")
env = require("./env")
exit = require("./exit")

DEBOUNCE_LIMIT = 1000
LOCK_TIMEOUT = 2000

class File
  constructor: (options = {}) ->
    if not options.path
      throw new Error("Must specify path to file when creating new FileUtil()")

    @path = options.path

    @_lockFileDir = path.join(os.tmpdir(), "cypress")
    @_lockFilePath = path.join(@_lockFileDir, "#{md5(@path)}.lock")

    @_queue = new Queue({concurrency: 1})

    @_cache = {}
    @_lastRead = 0

    exit.ensure => lockFile.unlockSync(@_lockFilePath)

  transaction: (fn) ->
    debug("transaction for %s", @path)
    @_addToQueue =>
      fn({
        get: @_get.bind(@, true)
        set: @_set.bind(@, true)
      })

  get: (args...) ->
    debug("get values from %s", @path)
    @_get(false, args...)

  set: (args...) ->
    debug("set values in %s", @path)
    @_set(false, args...)

  remove: ->
    debug("remove %s", @path)
    @_cache = {}
    @_lock()
    .then =>
      fs.removeAsync(@path)
    .finally =>
      debug("remove succeeded or failed for %s", @path)
      @_unlock()

  _get: (inTransaction, key, defaultValue) ->
    get = if inTransaction
      @_getContents()
    else
      @_addToQueue => @_getContents()

    get.then (contents) ->
      if not key?
        return contents

      value = _.get(contents, key)
      if value is undefined
        defaultValue
      else
        value

  _getContents: (inTransaction) ->
    ## read from disk on first call, but resolve cache for any subsequent
    ## calls within the DEBOUNCE_LIMIT
    ## once the DEBOUNCE_LIMIT passes, read from disk again
    ## on the next call
    if Date.now() - @_lastRead > DEBOUNCE_LIMIT
      @_lastRead = Date.now()
      @_read().then (contents) =>
        @_cache = contents
    else
      Promise.resolve(@_cache)

  _read: ->
    @_lock()
    .then =>
      debug('read %s', @path)
      fs.readJsonAsync(@path, "utf8")
    .catch (err) =>
      ## default to {} in certain cases, otherwise bubble up error
      if (
        err.code is "ENOENT" or ## file doesn't exist
        err.code is "EEXIST" or ## file contains invalid JSON
        err.name is "SyntaxError" ## can't get lock on file
      )
        return {}
      else
        throw err
    .finally =>
      debug("read succeeded or failed for %s", @path)
      @_unlock()

  _set: (inTransaction, key, value) ->
    if not _.isString(key) and not _.isPlainObject(key)
      type = if _.isArray(key) then "array" else (typeof key)
      throw new TypeError("Expected `key` to be of type `string` or `object`, got `#{type}`")

    valueObject = if _.isString(key)
      tmp = {}
      tmp[key] = value
      tmp
    else
      key

    if inTransaction
      @_setContents(valueObject)
    else
      @_addToQueue => @_setContents(valueObject)

  _setContents: (valueObject) ->
    @_getContents().then (contents) =>
      _.each valueObject, (value, key) ->
        _.set(contents, key, value)

      @_cache = contents
      @_write()

  _addToQueue: (operation) ->
    ## queues operations so they occur serially as invoked
    Promise.try =>
      @_queue.add(operation)

  _write: ->
    @_lock()
    .then =>
      debug('write %s', @path)
      fs.outputJsonAsync(@path, @_cache, {spaces: 2})
    .finally =>
      debug("write succeeded or failed for %s", @path)
      @_unlock()

  _lock: ->
    debug("attempt to get lock on %s", @path)
    fs.ensureDirAsync(@_lockFileDir).then =>
      ## polls every 100ms up to 2000ms to obtain lock, otherwise rejects
      lockFile.lockAsync(@_lockFilePath, {wait: LOCK_TIMEOUT})
    .finally =>
      debug("gettin lock succeeded or failed for %s", @path)

  _unlock: ->
    debug("attempt to unlock %s", @path)
    lockFile.unlockAsync(@_lockFilePath)
    .timeout(env.get("FILE_UNLOCK_TIMEOUT") or LOCK_TIMEOUT)
    .catch(Promise.TimeoutError, ->) ## ignore timeouts
    .finally =>
      debug("unlock succeeded or failed for %s", @path)

File.noopFile = {
  get: -> Promise.resolve({})
  set: -> Promise.resolve()
  transaction: ->
  remove: -> Promise.resolve()
}

module.exports = File
