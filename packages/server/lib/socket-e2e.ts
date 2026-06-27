import Debug from 'debug'
import preprocessor from './plugins/preprocessor'
import { SocketBase } from './socket-base'
import { fs } from './util/fs'
import { getCtx } from '@packages/data-context'
import type { DestroyableHttpServer } from './util/server_destroy'
import type { FoundSpec } from '@packages/types'

const debug = Debug('cypress:server:socket-e2e')

const isSpecialSpec = (name) => {
  return name.endsWith('__all')
}

export class SocketE2E extends SocketBase {
  private watchedSpecPaths: Set<string>

  constructor (config: Record<string, any>) {
    super(config)

    this.watchedSpecPaths = new Set()

    this.onTestFileChange = this.onTestFileChange.bind(this)

    if (config.watchForFileChanges) {
      preprocessor.emitter.on('file:updated', this.onTestFileChange)
    }
  }

  onBeforeSave (config) {
    // even if the user has turned off file watching
    // we want to force a reload on save
    if (!config.watchForFileChanges) {
      preprocessor.emitter.on('file:updated', this.onCloudTestFileChange)
    }
  }

  onAfterSave (config, error) {
    // even if the user has turned off file watching
    // we want to force a reload on save
    if (error && !config.watchForFileChanges) {
      preprocessor.emitter.off('file:updated', this.onCloudTestFileChange)
    }
  }

  onCloudTestFileChange = (filePath) => {
    // wait for the studio test file to be written to disk, then reload the test
    // and remove the listener (since this handler is only invoked when watchForFileChanges is false)
    return this.onTestFileChange(filePath).then(() => {
      this.removeOnCloudTestFileChange()
    })
  }

  removeOnCloudTestFileChange () {
    return preprocessor.emitter.off('file:updated', this.onCloudTestFileChange)
  }

  onTestFileChange = (filePath) => {
    debug('test file changed %o', filePath)

    return fs.statAsync(filePath)
    .then(() => {
      this._cdpIo?.emit('watched:file:changed')
      this._socketIo?.emit('watched:file:changed')
    }).catch(() => {
      return debug('could not find test file that changed %o', filePath)
    })
  }

  // Resolve the set of spec files that should be watched for the given spec.
  // For "Run All Specs" (`__all`) this is the current subset of specs the user
  // selected; for any other spec it is just that single file. We resolve the
  // run-all subset the same way the spec controller serves it so the watched
  // files stay in sync with what is actually bundled.
  private getSpecsToWatch (specConfig: FoundSpec): string[] {
    if (isSpecialSpec(specConfig.relative)) {
      const ctx = getCtx()

      // In case the user clicked "Run All Specs" and then deleted a spec in the
      // list, only watch specs we know to exist.
      const existingSpecs = new Set(ctx.project.specs.map(({ relative }) => relative))

      return ctx.project.runAllSpecs.filter((relative) => existingSpecs.has(relative))
    }

    const relative = specConfig.relative.startsWith('/') ? specConfig.relative.slice(1) : specConfig.relative

    return [relative]
  }

  watchTestFileByPath (config, specConfig: FoundSpec) {
    debug('watching spec with config %o', specConfig)

    const specsToWatch = new Set(this.getSpecsToWatch(specConfig))

    // remove watchers for specs that are no longer part of the active run so that
    // changing a file outside the current subset does not trigger a reload
    for (const relative of this.watchedSpecPaths) {
      if (!specsToWatch.has(relative)) {
        debug('removing watcher for test file path %o', relative)
        preprocessor.removeFile(relative, config)
        this.watchedSpecPaths.delete(relative)
      }
    }

    // set up watchers for any newly active specs
    return Promise.all([...specsToWatch].map((relative) => {
      if (this.watchedSpecPaths.has(relative)) {
        return
      }

      this.watchedSpecPaths.add(relative)
      debug('will watch test file path %o', relative)

      return preprocessor.getFile(relative, config)
      // ignore errors b/c we're just setting up the watching. errors
      // are handled by the spec controller
      .catch(() => {})
    }))
  }

  startListening (server: DestroyableHttpServer, automation, config, options) {
    return super.startListening(server, automation, config, options, {
      onSocketConnection: (socket) => {
        socket.on('watch:test:file', (specInfo: FoundSpec, cb = function () { }) => {
          debug('watch:test:file %o', specInfo)

          this.watchTestFileByPath(config, specInfo)

          // callback is only for testing purposes
          return cb()
        })
      },
    })
  }

  close () {
    preprocessor.emitter.removeListener('file:updated', this.onTestFileChange)

    return super.close()
  }
}
