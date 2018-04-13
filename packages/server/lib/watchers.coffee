_ = require("lodash")
chokidar = require("chokidar")
dependencyTree = require("dependency-tree")
pathHelpers = require("./util/path_helpers")

class Watchers
  constructor: ->
    if not (@ instanceof Watchers)
      return new Watchers

    @watchers = {}

  close: ->
    for filePath of @watchers
      @_remove(filePath)

  watch: (filePath, options = {}) ->
    _.defaults options,
      interval:   250
      usePolling: true
      useFsEvents: false
      ignored:    null
      onChange:   null
      onReady:    null
      onError:    null

    w = chokidar.watch(filePath, options)

    @_add(filePath, w)

    if _.isFunction(options.onChange)
      w.on "change", options.onChange

    if _.isFunction(options.onReady)
      w.on "ready", options.onReady

    if _.isFunction(options.onError)
      w.on "error", options.onError

    return @

  watchTree: (filePath, options = {}) ->
    files = dependencyTree.toList({
      filename: filePath
      directory: process.cwd()
      filter: (filePath) ->
        filePath.indexOf("node_modules") is -1
    })

    _.each files, (file) =>
      @watch(file, options)

  _add: (filePath, watcher) ->
    @_remove(filePath)

    @watchers[filePath] = watcher

  _remove: (filePath) ->
    return if not watcher = @watchers[filePath]

    watcher.close()
    delete @watchers[filePath]

module.exports = Watchers
