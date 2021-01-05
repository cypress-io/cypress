import Debug from 'debug'
import path from 'path'
import preprocessor from './plugins/preprocessor'
import { SocketBase } from './socket-base'
import fs from './util/fs'
import { DestroyableHttpServer } from './util/server_destroy'

const debug = Debug('cypress:server:socket-e2e')

const isSpecialSpec = (name) => {
  return name.endsWith('__all')
}

export class SocketE2E extends SocketBase {
  private testFilePath: string | null

  constructor (config: Record<string, any>) {
    super(config)

    this.testFilePath = null

    if (config.watchForFileChanges) {
      preprocessor.emitter.on('file:updated', this.onTestFileChange)
    }
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

  watchTestFileByPath (config, specConfig, options) {
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

          this.watchTestFileByPath(config, specInfo, options)

          // callback is only for testing purposes
          return cb()
        })
      },
    })
  }

  close () {
    preprocessor.emitter.removeListener('file:updated', this.onTestFileChange)

    super.close()
  }
}
