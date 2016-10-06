_         = require("lodash")
Promise   = require("bluebird")
chokidar  = require("chokidar")

class Watchers
  constructor: ->
    if not (@ instanceof Watchers)
      return new Watchers

    @watched = {}

  remove: (key) ->
    return if not watched = @watched[key]

    watched.close()
    delete @watched[key]

  _add: (pathToFile, watched) ->
    @remove(pathToFile)

    @watched[pathToFile] = watched

  close: ->
    for key, val of @watched
      @remove(key)

  watchAsync: (pathToFile, options = {}) ->
    _this = @

    new Promise (resolve, reject) =>
      options.onReady = ->
        resolve()

      @watch(pathToFile, options)

  watch: (pathToFile, options = {}) ->
    _.defaults options,
      interval:   250
      usePolling: true
      useFsEvents: false
      ignored:    null
      onChange:   null
      onReady:    null
      onError:    null

    w = chokidar.watch(pathToFile, options)

    @_add(pathToFile, w)

    if _.isFunction(options.onChange)
      w.on "change", options.onChange

    if _.isFunction(options.onReady)
      w.on "ready", options.onReady

    if _.isFunction(options.onError)
      w.on "error", options.onError

    return @

module.exports = Watchers