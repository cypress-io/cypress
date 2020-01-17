import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import Promise from 'bluebird'
import socketIo from '@packages/socket'
import { SocketIO } from '@packages/socket/types'
import fs from './util/fs'
import open from './util/open'

const exec = require('./exec')
const task = require('./task')
const files = require('./files')
const fixture = require('./fixture')
const errors = require('./errors')
const preprocessor = require('./plugins/preprocessor')

const debug = Debug('cypress:server:socket')
const debugVerbose = Debug('cypress-verbose:server:socket')

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
  return Promise.delay(25).then(fn)
}

const isSpecialSpec = (name) => {
  return name.endsWith('__all')
}

const _attachDebugLogger = (socket: SocketIO.Socket) => {
  if (!debugVerbose.enabled) {
    return
  }

  socket.use((packet, next) => {
    debugVerbose('packet received %o', { socketRooms: _.values(socket.rooms), packet })
    next()
  })
}

class Socket {
  io: SocketIO.Server
  ended: boolean = false
  testFilePath?: string
  testsDir?: string

  constructor (config) {
    this.onTestFileChange = this.onTestFileChange.bind(this)

    if (config.watchForFileChanges) {
      preprocessor.emitter.on('file:updated', this.onTestFileChange)
    }
  }

  onTestFileChange (filePath) {
    debug('test file changed %o', filePath)

    return fs.statAsync(filePath)
    .then(() => {
      return this.io.emit('watched:file:changed')
    }).catch(() => {
      return debug('could not find test file that changed %o', filePath)
    })
  }

  // TODO: clean this up by sending the spec object instead of
  // the url path
  watchTestFileByPath (config, originalFilePath) {
    // files are always sent as integration/foo_spec.js
    // need to take into account integrationFolder may be different so
    // integration/foo_spec.js becomes cypress/my-integration-folder/foo_spec.js
    debug('watch test file %o', originalFilePath)
    let filePath = path.join(config.integrationFolder, originalFilePath.replace(`integration${path.sep}`, ''))

    filePath = path.relative(config.projectRoot, filePath)

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

  toRunner (event, data) {
    return this.io && this.io.to('runner').emit(event, data)
  }

  isSocketConnected (socket) {
    return socket && socket.connected
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
    })
  }

  startListening (server, automation, config, options) {
    let existingState = null

    _.defaults(options, {
      socketId: null,
      onIncomingXhr () {},
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
      onUnexpectedDisconnect () {},
    })

    let automationClient: any = null

    const { integrationFolder, socketIoRoute, socketIoCookie } = config

    this.testsDir = integrationFolder

    this.io = this.createIo(server, socketIoRoute, socketIoCookie)

    automation.use({
      onPush: (message, data) => {
        return this.io.emit('automation:push:message', message, data)
      },
    })

    const onAutomationClientRequestCallback = (message, data, id) => {
      return this.onAutomation(automationClient, message, data, id)
    }

    const automationRequest = (message, data) => {
      return automation.request(message, data, onAutomationClientRequestCallback)
    }

    return this.io.on('connection', (socket: SocketIO.Client) => {
      debug('socket connected')

      _attachDebugLogger(socket)

      // cache the headers so we can access
      // them at any time
      const headers = (socket.request != null ? socket.request.headers : undefined) != null ? (socket.request != null ? socket.request.headers : undefined) : {}

      let pendingDcPromise: Promise<void> | undefined

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
          return Promise.delay(500)
          .then(() => {
            // bail if we've swapped to a new automationClient
            if (automationClient !== socket) {
              return
            }

            // give ourselves about 500ms to reconnected
            // and if we're connected its all good
            if (automationClient.connected) {
              return
            }

            options.onUnexpectedDisconnect()

            // TODO: if all of our clients have also disconnected
            // then don't warn anything
            errors.warning('AUTOMATION_SERVER_DISCONNECTED')

            // TODO: no longer emit this, just close the browser and display message in reporter
            return this.io.emit('automation:disconnected')
          })
        })

        socket.on('automation:push:request', (message, data, cb) => {
          automation.push(message, data)

          // just immediately callback because there
          // is not really an 'ack' here
          if (cb) {
            return cb()
          }
        })

        return socket.on('automation:response', automation.response)
      })

      socket.on('automation:request', (message, data, cb) => {
        debug('automation:request %s %o', message, data)

        return automationRequest(message, data)
        .then((resp) => {
          return cb({ response: resp })
        }).catch((err) => {
          return cb({ error: errors.clone(err) })
        })
      })

      socket.on('runner:connected', () => {
        if (socket.inRunnerRoom) {
          return
        }

        if (pendingDcPromise) {
          // any pending disconnection check is invalid now, since a new runner has connected
          pendingDcPromise.cancel()
          pendingDcPromise = undefined
        }

        socket.on('disconnect', () => {
          debug('runner socket disconnected %o', { now: Date.now(), lastVisitResolvedAt: socket.lastVisitResolvedAt, ended: this.ended })

          // if we've stopped then don't do anything
          if (this.ended) {
            return
          }

          const assertNewRunnerConnected = () => {
            pendingDcPromise = undefined

            const sockets = this.io.sockets.connected

            const hasNewRunnerConnected = _.some(_.values(sockets).map((sock) => {
              // socket.io should remove d/c'd sockets from the room, but check just in case
              return sock.inRunnerRoom && sock !== socket
            }))

            debug('checking to see if a new runner socket is available... %o', { hasNewRunnerConnected, sockets })

            if (!hasNewRunnerConnected) {
              options.onUnexpectedDisconnect()
            }
          }

          if (socket.lastVisitResolvedAt) {
            const msSinceLastVisitResolved = Date.now() - socket.lastVisitResolvedAt
            const delay = 10000 - msSinceLastVisitResolved

            if (delay > 0) {
              // we are resolving a cy.visit, wait up to 10 seconds then check to see if there is a new `runner`
              pendingDcPromise = Promise.delay(delay)
              .then(assertNewRunnerConnected)

              return
            }
          }

          // in any other case, assert immediately
          return assertNewRunnerConnected()
        })

        socket.inRunnerRoom = true

        return socket.join('runner')
      })

      socket.on('spec:changed', (spec) => {
        return options.onSpecChanged(spec)
      })

      socket.on('watch:test:file', (filePath, cb = function () {}) => {
        this.watchTestFileByPath(config, filePath)

        // callback is only for testing purposes
        return cb()
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
          return Promise
          .try(isConnected)
          .catch(() => {
            return retry(tryConnected)
          })
        }

        // retry for up to data.timeout
        // or 1 second
        return Promise
        .try(tryConnected)
        .timeout(data.timeout != null ? data.timeout : 1000)
        .then(() => {
          return cb(true)
        }).catch(Promise.TimeoutError, (err) => {
          debug('is:automation:client:connected timed out %o', { err })

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
              .finally(() => {
                socket.lastVisitResolvedAt = Date.now()
              })
            }
            case 'http:request':
              return options.onRequest(headers, automationRequest, args[0])
            case 'reset:server:state':
              return options.onResetServerState()
            case 'incoming:xhr':
              return options.onIncomingXhr(args[0], args[1])
            case 'get:fixture':
              return fixture.get(config.fixturesFolder, args[0], args[1])
            case 'read:file':
              return files.readFile(config.projectRoot, args[0], args[1])
            case 'write:file':
              return files.writeFile(config.projectRoot, args[0], args[1], args[2])
            case 'exec':
              return exec.run(config.projectRoot, args[0])
            case 'task':
              return task.run(config.pluginsFile, args[0])
            default:
              throw new Error(
                `You requested a backend event we cannot handle: ${eventName}`
              )
          }
        }

        return Promise.try(backendRequest)
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
        return require('electron').shell.openExternal(url)
      })

      reporterEvents.forEach((event) => {
        return socket.on(event, (data) => {
          return this.toRunner(event, data)
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
    preprocessor.emitter.removeListener('file:updated', this.onTestFileChange)

    return (this.io != null ? this.io.close() : undefined)
  }
}

module.exports = Socket
