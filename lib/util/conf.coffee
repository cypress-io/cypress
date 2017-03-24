_ = require("lodash")
md5 = require("md5")
os = require("os")
path = require("path")
Promise = require("bluebird")
lockFile = Promise.promisifyAll(require("lockfile"))
fs = Promise.promisifyAll(require("fs-extra"))
exit = require("./exit")

module.exports = class Conf
  constructor: (options = {}) ->
    _.defaults(options, {
      configName: "config"
    })

    if not options.cwd
      throw new Error("Must specify cwd when creating new Conf()")

    @cache = null
    @path = path.join(options.cwd, "#{options.configName}.json")
    @lockFilePath = path.join(os.tmpdir(), "#{md5(@path)}.lock")

    exit.ensure => lockFile.unlockSync(@lockFilePath)

  get: (key, defaultValue) ->
    @_getStore().then (store) ->
      if not key?
        return store

      value = _.get(store, key)
      if value is undefined
        defaultValue
      else
        value

  set: (key, value) ->
    if not _.isString(key) and not _.isObject(key)
      throw new TypeError("Expected `key` to be of type `string` or `object`, got `#{typeof key}`")

    valueObject = if _.isString(key)
      tmp = {}
      tmp[key] = value
      tmp
    else
      key

    @_getStore().then (store) =>
      _.each valueObject, (value, key) ->
        _.set(store, key, value)

      @cache = store
      @_setStore()

  _getStore: ->
    if @cache and _.isObject(@cache)
      Promise.resolve(@cache)
    else
      @_getStoreFromDisk().then (store) =>
        @cache = store

  _getStoreFromDisk: ->
    @_lock()
    .then =>
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

  _setStore: ->
    @_lock()
    .then =>
      fs.outputJsonAsync(@path, @cache, {spaces: 2})
    .finally =>
      @_unlock()

  _lock: ->
    ## polls every 100ms up to 2000ms to obtain lock, otherwise rejects
    lockFile.lockAsync(@lockFilePath, {wait: 2000})

  _unlock: ->
    lockFile.unlockAsync(@lockFilePath)
