import Debug from 'debug'
import path from 'path'
import preprocessor from './plugins/preprocessor'
import { SocketBase } from './socket-base'
import { fs } from './util/fs'
import { DestroyableHttpServer } from './util/server_destroy'
import * as studio from './studio'

const debug = Debug('cypress:server:socket-e2e')

const isSpecialSpec = (name) => {
  return name.endsWith('__all')
}

export class SocketE2E extends SocketBase {
  private testFilePath: string | null

  constructor (config: Record<string, any>) {
    super(config)

    this.testFilePath = null

    this.onTestFileChange = this.onTestFileChange.bind(this)
    this.onStudioTestFileChange = this.onStudioTestFileChange.bind(this)
    this.removeOnStudioTestFileChange = this.removeOnStudioTestFileChange.bind(this)

    if (config.watchForFileChanges) {
      preprocessor.emitter.on('file:updated', this.onTestFileChange)
    }
  }

  onStudioTestFileChange (filePath) {
    // wait for the studio test file to be written to disk, then reload the test
    // and remove the listener (since this handler is only invoked when watchForFileChanges is false)
    return this.onTestFileChange(filePath).then(() => {
      this.removeOnStudioTestFileChange()
    })
  }

  removeOnStudioTestFileChange () {
    return preprocessor.emitter.off('file:updated', this.onStudioTestFileChange)
  }

  onTestFileChange = (filePath) => {
    debug('test file changed %o', filePath)

    return fs.statAsync(filePath)
    .then(() => {
      return this.io.emit('watched:file:changed')
    }).catch(() => {
      return debug('could not find test file that changed %o', filePath)
    })
  }

  watchTestFileByPath (config, specConfig) {
    debug('watching spec with config %o', specConfig)

    const cleanIntegrationPrefix = (s) => {
      const removedIntegrationPrefix = path.join(config.integrationFolder, s.replace(`integration${path.sep}`, ''))

      return path.relative(config.projectRoot, removedIntegrationPrefix)
    }

    // previously we have assumed that we pass integration spec path with "integration/" prefix
    // now we pass spec config object that tells what kind of spec it is, has relative path already
    // so the only special handling remains for special paths like "integration/__all"
    const filePath = typeof specConfig === 'string' ? cleanIntegrationPrefix(specConfig) : specConfig.relative

    // bail if this is special path like "__all"
    // maybe the client should not ask to watch non-spec files?
    if (isSpecialSpec(filePath)) {
      return
    }

    // bail if we're already watching this exact file
    if (filePath === this.testFilePath) {
      return
    }

    // remove the existing file by its path
    if (this.testFilePath) {
      preprocessor.removeFile(this.testFilePath, config)
    }

    // store this location
    this.testFilePath = filePath
    debug('will watch test file path %o', filePath)

    return preprocessor.getFile(filePath, config)
    // ignore errors b/c we're just setting up the watching. errors
    // are handled by the spec controller
    .catch(() => {})
  }

  startListening (server: DestroyableHttpServer, automation, config, options) {
    const { integrationFolder } = config

    this.testsDir = integrationFolder

    return super.startListening(server, automation, config, options, {
      onSocketConnection: (socket) => {
        socket.on('watch:test:file', (specInfo, cb = function () { }) => {
          debug('watch:test:file %o', specInfo)

          this.watchTestFileByPath(config, specInfo)

          // callback is only for testing purposes
          return cb()
        })

        socket.on('studio:init', (cb) => {
          studio.getStudioModalShown()
          .then(cb)
        })

        socket.on('studio:save', (saveInfo, cb) => {
          // even if the user has turned off file watching
          // we want to force a reload on save
          if (!config.watchForFileChanges) {
            preprocessor.emitter.on('file:updated', this.onStudioTestFileChange)
          }

          studio.save(saveInfo)
          .then((err) => {
            cb(err)

            // onStudioTestFileChange will remove itself after being called
            // but if there's an error, it never gets called so we manually remove it
            if (err && !config.watchForFileChanges) {
              this.removeOnStudioTestFileChange()
            }
          })
        })
      },
    })
  }

  close () {
    preprocessor.emitter.removeListener('file:updated', this.onTestFileChange)

    super.close()
  }
}
