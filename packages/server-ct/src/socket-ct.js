const _ = require('lodash')
const debug = require('debug')('cypress:server-ct:socket')
const Bluebird = require('bluebird')
const socketIo = require('@packages/socket')
const editors = require('@packages/server/lib/util/editors')
const { openFile } = require('@packages/server/lib/util/file-opener')
const open = require('@packages/server/lib/util/open')
const errors = require('@packages/server/lib/errors')
const specsUtil = require('@packages/server/lib/util/specs')

const runnerEvents = [
  'reporter:restart:test:run',
  'runnables:ready',
  'run:start',
  'test:before:run:async',
  'reporter:log:add',
  'reporter:log:state:changed',
  'paused',
  'test:after:hooks',
  'run:end',
]

const reporterEvents = [
  // "go:to:file"
  'runner:restart',
  'runner:abort',
  'runner:console:log',
  'runner:console:error',
  'runner:show:snapshot',
  'runner:hide:snapshot',
  'reporter:restarted',
]

const retry = (fn) => {
  return Bluebird.delay(25).then(fn)
}

class Socket {
  constructor (config) {
    this.ended = false

    this.onTestFileChange = this.onTestFileChange.bind(this)
    if (config.watchForFileChanges) {
      // devServer.emitter.on('file:updated', this.onTestFileChange)
    }
  }

  onTestFileChange (filePath) {
    debug('test file changed %o', filePath)

    // return fs.statAsync(filePath)
    // .then(() => {
    //   return this.io.emit('watched:file:changed')
    // }).catch(() => {
    //   return debug('could not find test file that changed %o', filePath)
    // })
  }

  // watchTestFileByPath (config, specConfig, options) {
  //   debug('watching spec with config %o', specConfig)

  //   const cleanIntegrationPrefix = (s) => {
  //     const removedIntegrationPrefix = path.join(config.integrationFolder, s.replace(`integration${path.sep}`, ''))

  //     return path.relative(config.projectRoot, removedIntegrationPrefix)
  //   }

  //   // previously we have assumed that we pass integration spec path with "integration/" prefix
  //   // now we pass spec config object that tells what kind of spec it is, has relative path already
  //   // so the only special handling remains for special paths like "integration/__all"
  //   const filePath = typeof specConfig === 'string' ? cleanIntegrationPrefix(specConfig) : specConfig.relative

  //   // bail if this is special path like "__all"
  //   // maybe the client should not ask to watch non-spec files?
  //   if (isSpecialSpec(filePath)) {
  //     return
  //   }

  //   // bail if we're already watching this exact file
  //   if (filePath === this.testFilePath) {
  //     return
  //   }

  //   // remove the existing file by its path
  //   if (this.testFilePath) {
  //     preprocessor.removeFile(this.testFilePath, config)
  //   }

  //   // store this location
  //   this.testFilePath = filePath
  //   debug('will watch test file path %o', filePath)

  //   return preprocessor.getFile(filePath, config)
  //   // ignore errors b/c we're just setting up the watching. errors
  //   // are handled by the spec controller
  //   .catch(() => {})
  // }

  toReporter (event, data) {
    return this.io && this.io.to('reporter').emit(event, data)
  }

  toRunner (event, data) {
    return this.io && this.io.to('runner').emit(event, data)
  }

  isSocketConnected (socket) {
    return socket && socket.connected
  }

  toDriver (event, ...data) {
    return this.io && this.io.emit(event, ...data)
  }

  onAutomation (socket, message, data, id) {
    // instead of throwing immediately here perhaps we need
    // to make this more resilient by automatically retrying
    // up to 1 second in the case where our automation room
    // is empty. that would give padding for reconnections
    // to automatically happen.
    // for instance when socket.io detects a disconnect
    // does it immediately remove the member from the room?
    // YES it does per http://socket.io/docs/rooms-and-namespaces/#disconnection
    if (this.isSocketConnected(socket)) {
      return socket.emit('automation:request', id, message, data)
    }

    throw new Error(`Could not process '${message}'. No automation clients connected.`)
  }

  createIo (server, path, cookie) {
    return socketIo.server(server, {
      path,
      destroyUpgrade: false,
      serveClient: false,
      cookie,
      parser: socketIo.circularParser,
      transports: ['websocket'],
    })
  }

  startListening (server, config, options) {
    let existingState = null

    _.defaults(options, {
      socketId: null,
      onResetServerState () {},
      onSetRunnables () {},
      onMocha () {},
      onConnect () {},
      onRequest () {},
      onResolveUrl () {},
      onFocusTests () {},
      onSpecChanged () {},
      onChromiumRun () {},
      onReloadBrowser () {},
      checkForAppErrors () {},
      onSavedStateChanged () {},
      onTestFileChange () {},
      onCaptureVideoFrames () {},
    })

    let automationClient = null

    const { componentFolder, socketIoRoute, socketIoCookie } = config

    this.testsDir = componentFolder

    this.io = this.createIo(server, socketIoRoute, socketIoCookie)

    const automationRequest = (message, data) => {
      // return automation.request(message, data, onAutomationClientRequestCallback)
    }

    return this.io.on('connection', (socket) => {
      debug('socket connected')

      // cache the headers so we can access
      // them at any time
      const headers = (socket.request != null ? socket.request.headers : undefined) != null ? (socket.request != null ? socket.request.headers : undefined) : {}

      socket.on('automation:client:connected', () => {
        if (automationClient === socket) {
          return
        }

        automationClient = socket

        debug('automation:client connected')

        // if our automation disconnects then we're
        // in trouble and should probably bomb everything
        automationClient.on('disconnect', () => {
          // if we've stopped then don't do anything
          if (this.ended) {
            return
          }

          // if we are in headless mode then log out an error and maybe exit with process.exit(1)?
          return Bluebird.delay(2000)
          .then(() => {
            // bail if we've swapped to a new automationClient
            if (automationClient !== socket) {
              return
            }

            // give ourselves about 2000ms to reconnect
            // and if we're connected its all good
            if (automationClient.connected) {
              return
            }

            // TODO: if all of our clients have also disconnected
            // then don't warn anything
            errors.warning('AUTOMATION_SERVER_DISCONNECTED')

            // TODO: no longer emit this, just close the browser and display message in reporter
            return this.io.emit('`automation:disconnected`')
          })
        })

        socket.on('automation:push:request', (message, data, cb) => {
          // just immediately callback because there
          // is not really an 'ack' here
          if (cb) {
            return cb()
          }
        })
      })

      socket.on('reporter:connected', () => {
        if (socket.inReporterRoom) {
          return
        }

        socket.inReporterRoom = true

        return socket.join('reporter')
      })

      // TODO: what to do about reporter disconnections?

      socket.on('runner:connected', () => {
        if (socket.inRunnerRoom) {
          return
        }

        socket.inRunnerRoom = true

        return socket.join('runner')
      })

      // TODO: this is just an example... the specs
      // likely need to be cached in memory and served
      // by the project controller, and the watchers
      // need to update the specs in memory whenever
      // they change to avoid querying the filesystem
      // everytime the specs change
      socket.on('get:component:specs', (cb) => {
        return specsUtil.find(config)
        .filter((spec) => {
          return spec.specType === 'component'
        })
        .then(cb)
      })

      // TODO: what to do about runner disconnections?

      socket.on('spec:changed', (spec) => {
        return options.onSpecChanged(spec)
      })

      socket.on('app:connect', (socketId) => {
        return options.onConnect(socketId, socket)
      })

      socket.on('set:runnables', (runnables, cb) => {
        options.onSetRunnables(runnables)

        return cb()
      })

      socket.on('mocha', (...args) => {
        return options.onMocha.apply(options, args)
      })

      socket.on('open:finder', (p, cb = function () {}) => {
        return open.opn(p)
        .then(() => {
          return cb()
        })
      })

      socket.on('reload:browser', (url, browser) => {
        return options.onReloadBrowser(url, browser)
      })

      socket.on('focus:tests', () => {
        return options.onFocusTests()
      })

      socket.on('is:automation:client:connected', (data = {}, cb) => {
        const isConnected = () => {
          return automationRequest('is:automation:client:connected', data)
        }

        const tryConnected = () => {
          return Bluebird
          .try(isConnected)
          .catch(() => {
            return retry(tryConnected)
          })
        }

        // retry for up to data.timeout
        // or 1 second
        return Bluebird
        .try(tryConnected)
        .timeout(data.timeout != null ? data.timeout : 1000)
        .then(() => {
          return cb(true)
        }).catch(Bluebird.TimeoutError, (err) => {
          return cb(false)
        })
      })

      socket.on('backend:request', (eventName, ...args) => {
        // cb is always the last argument
        const cb = args.pop()

        debug('backend:request %o', { eventName, args })

        const backendRequest = () => {
          switch (eventName) {
            case 'preserve:run:state':
              existingState = args[0]

              return null
            case 'resolve:url': {
              const [url, resolveOpts] = args

              return options.onResolveUrl(url, headers, automationRequest, resolveOpts)
            }
            case 'http:request':
              return options.onRequest(headers, automationRequest, args[0])
            case 'reset:server:state':
              return options.onResetServerState()
            default:
              throw new Error(
                `You requested a backend event we cannot handle: ${eventName}`,
              )
          }
        }

        return Bluebird.try(backendRequest)
        .then((resp) => {
          return cb({ response: resp })
        }).catch((err) => {
          return cb({ error: errors.clone(err) })
        })
      })

      socket.on('get:existing:run:state', (cb) => {
        let s

        s = existingState

        if (s) {
          existingState = null

          return cb(s)
        }

        return cb()
      })

      socket.on('save:app:state', (state, cb) => {
        options.onSavedStateChanged(state)

        // we only use the 'ack' here in tests
        if (cb) {
          return cb()
        }
      })

      socket.on('external:open', (url) => {
        debug('received external:open %o', { url })

        return require('electron').shell.openExternal(url)
      })

      socket.on('get:user:editor', (cb) => {
        editors.getUserEditor(false)
        .then(cb)
      })

      socket.on('set:user:editor', (editor) => {
        editors.setUserEditor(editor)
      })

      socket.on('open:file', (fileDetails) => {
        openFile(fileDetails)
      })

      reporterEvents.forEach((event) => {
        return socket.on(event, (data) => {
          return this.toRunner(event, data)
        })
      })

      return runnerEvents.forEach((event) => {
        return socket.on(event, (data) => {
          return this.toReporter(event, data)
        })
      })
    })
  }

  end () {
    this.ended = true

    // TODO: we need an 'ack' from this end
    // event from the other side
    return this.io && this.io.emit('tests:finished')
  }

  changeToUrl (url) {
    return this.toRunner('change:to:url', url)
  }

  close () {
    return (this.io != null ? this.io.close() : undefined)
  }
}

module.exports = Socket
