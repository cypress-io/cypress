import _ from 'lodash'
import chokidar from 'chokidar'
import dependencyTree from 'dependency-tree'
import { nxs } from 'nexus-decorators'

@nxs.objectType({
  description: 'All of the watchers associated with a given project',
  definition (t) {
    t.string('watchers', {
      resolve: (obj) => Object.keys(obj.watchers),
    })
  },
})
class Watchers {
  watchers: Record<string, any> = {}

  constructor () {
    if (!(this instanceof Watchers)) {
      return new Watchers
    }
  }

  close () {
    const result: string[] = []

    for (let filePath in this.watchers) {
      result.push(this._remove(filePath))
    }

    return result
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

    this._add(filePath, w)

    if (_.isFunction(options.onChange)) {
      w.on('change', options.onChange)
    }

    if (_.isFunction(options.onReady)) {
      w.on('ready', options.onReady)
    }

    if (_.isFunction(options.onError)) {
      w.on('error', options.onError)
    }

    return this
  }

  watchTree (filePath, options = {}) {
    const files = dependencyTree.toList({
      filename: filePath,
      directory: process.cwd(),
      filter (filePath) {
        return filePath.indexOf('node_modules') === -1
      },
    })

    return _.each(files, (file) => {
      return this.watch(file, options)
    })
  }

  _add (filePath, watcher) {
    this._remove(filePath)

    this.watchers[filePath] = watcher
  }

  _remove (filePath: string) {
    this.watchers[filePath]?.close()

    delete this.watchers[filePath]

    return filePath
  }
}

module.exports = Watchers
