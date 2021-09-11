const _ = require('lodash')
const chokidar = require('chokidar')
const dependencyTree = require('dependency-tree')

class Watchers {
  constructor () {
    if (!(this instanceof Watchers)) {
      return new Watchers
    }

    this.watchers = {}
  }

  close () {
    return (() => {
      const result = []

      for (let filePath in this.watchers) {
        result.push(this._remove(filePath))
      }

      return Promise.all(result)
    })()
  }

  watch (filePath, options = {}) {
    _.defaults(options, {
      useFsEvents: true,
      ignored: null,
      onChange: null,
      onReady: null,
      onError: null,
    })

    const w = chokidar.watch(filePath, options)

    if (_.isFunction(options.onChange)) {
      w.on('change', options.onChange)
    }

    if (_.isFunction(options.onReady)) {
      w.on('ready', options.onReady)
    }

    if (_.isFunction(options.onError)) {
      w.on('error', options.onError)
    }

    return this._add(filePath, w)
  }

  watchTree (filePath, options = {}) {
    const files = dependencyTree.toList({
      filename: filePath,
      directory: process.cwd(),
      filter (filePath) {
        return filePath.indexOf('node_modules') === -1
      },
    })

    return Promise.all(files.map((file) => {
      return this.watch(file, options)
    }))
  }

  _add (filePath, watcher) {
    return this._remove(filePath)
    .then(() => {
      this.watchers[filePath] = watcher
    })
  }

  _remove (filePath) {
    let watcher

    if (!(watcher = this.watchers[filePath])) {
      return Promise.resolve()
    }

    return watcher.close().then(() => {
      delete this.watchers[filePath]
    })
  }
}

module.exports = Watchers
