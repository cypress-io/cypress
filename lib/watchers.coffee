_           = require("lodash")
chokidar    = require("chokidar")
bundle      = require("./util/bundle")
pathHelpers = require("./util/path_helpers")

class Watchers
  constructor: ->
    if not (@ instanceof Watchers)
      return new Watchers

    @watchers = {}
    @bundleWatchers = {}

  close: ->
    for filePath of @watchers
      @_remove(filePath)
    for filePath of @bundleWatchers
      @removeBundle(filePath)

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

  _add: (filePath, watcher) ->
    @_remove(filePath)

    @watchers[filePath] = watcher

  _remove: (filePath) ->
    return if not watcher = @watchers[filePath]

    watcher.close()
    delete @watchers[filePath]

  watchBundle: (filePath, config, options = {}) ->
    _.defaults options,
      onChange: null
      onReady: null

    ## dont watch for file changes if
    ## config has specifically turned it off
    shouldWatch = config.watchForFileChanges isnt false

    if not watcher = @bundleWatchers[filePath]
      watcher = bundle.build(filePath, config, shouldWatch)
      @_addBundle(filePath, watcher)

    if _.isFunction(options.onChange)
      watcher.addChangeListener(options.onChange)

    return watcher.getLatestBundle()

  _addBundle: (filePath, watcher) ->
    @bundleWatchers[filePath] = watcher

  removeBundle: (filePath) ->
    return if not watcher = @bundleWatchers[filePath]

    watcher.close()
    delete @bundleWatchers[filePath]

module.exports = Watchers
