_ = require("lodash")
path = require("path")
Promise = require("bluebird")
fs = Promise.promisifyAll(require("fs-extra"))

module.exports = class Conf
  constructor: (options = {}) ->
    _.defaults(options, {
      configName: "config"
    })

    if not options.cwd
      throw new Error("Must specify cwd when creating new Conf()")

    @cache = null
    @path = path.resolve(options.cwd, "#{options.configName}.json")

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

  _ensureDir: ->
    fs.ensureDirAsync(path.dirname(@path))

  _getStore: ->
    if @cache and _.isObject(@cache)
      return Promise.resolve(@cache)

    fs.readFileAsync(@path, "utf8")
    .then (contents) ->
      JSON.parse(contents)
    .catch (err) =>
      if err.name is "SyntaxError"
        return {}

      if err.code is "ENOENT"
        return @_ensureDir().return({})

      throw err
    .then (store) =>
      @cache = store

  _setStore: ->
    @_ensureDir().then =>
      fs.writeFileAsync(@path, JSON.stringify(@cache, null, 2))
