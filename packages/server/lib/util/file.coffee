_ = require("lodash")
md5 = require("md5")
os = require("os")
path = require("path")
Promise = require("bluebird")
Queue = require("p-queue")
lockFile = Promise.promisifyAll(require("lockfile"))
fs = Promise.promisifyAll(require("fs-extra"))
fs = require("./fs")
exit = require("./exit")
log = require('debug')('cypress:server:file')

DEBOUNCE_LIMIT = 1000

module.exports = class Conf
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
    @_addToQueue =>
      fn({
        get: @_get.bind(@, true)
        set: @_set.bind(@, true)
      })

  get: (args...) ->
    @_get(false, args...)

  set: (args...) ->
    @_set(false, args...)

  remove: ->
    @_cache = {}
    @_lock()
    .then =>
      fs.removeAsync(@path)
    .finally =>
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
      log('reading JSON file %s', @path)
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
      log('writing JSON file %s', @path)
      fs.outputJsonAsync(@path, @_cache, {spaces: 2})
    .finally =>
      @_unlock()

  _lock: ->
    fs.ensureDirAsync(@_lockFileDir).then =>
      ## polls every 100ms up to 2000ms to obtain lock, otherwise rejects
      lockFile.lockAsync(@_lockFilePath, {wait: 2000})

  _unlock: ->
    lockFile.unlockAsync(@_lockFilePath)
