import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import { onNetEvent } from '@packages/net-stubbing'
import * as socketIo from '@packages/socket'
import firefoxUtil from './browsers/firefox-util'
import errors from './errors'
import exec from './exec'
import files from './files'
import fixture from './fixture'
import task from './task'
import { ensureProp } from './util/class-helpers'
import { getUserEditor, setUserEditor } from './util/editors'
import { openFile } from './util/file-opener'
import open from './util/open'
import { DestroyableHttpServer } from './util/server_destroy'

type StartListeningCallbacks = {
  onSocketConnection: (socket: any) => void
}

type RunnerEvent =
  'reporter:restart:test:run'
  | 'runnables:ready'
  | 'run:start'
  | 'test:before:run:async'
  | 'reporter:log:add'
  | 'reporter:log:state:changed'
  | 'paused'
  | 'test:after:hooks'
  | 'run:end'

const runnerEvents: RunnerEvent[] = [
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

type ReporterEvent =
  'runner:restart'
 | 'runner:abort'
 | 'runner:console:log'
 | 'runner:console:error'
 | 'runner:show:snapshot'
 | 'runner:hide:snapshot'
 | 'reporter:restarted'

const reporterEvents: ReporterEvent[] = [
  // "go:to:file"
  'runner:restart',
  'runner:abort',
  'runner:console:log',
  'runner:console:error',
  'runner:show:snapshot',
  'runner:hide:snapshot',
  'reporter:restarted',
]

const debug = Debug('cypress:server:socket-base')

const retry = (fn: (res: any) => void) => {
  return Bluebird.delay(25).then(fn)
}

export class SocketBase {
  protected ended: boolean
  protected _io?: socketIo.SocketIOServer
  protected testsDir: string | null

  constructor (config: Record<string, any>) {
    this.ended = false
    this.testsDir = null
  }

  protected ensureProp = ensureProp

  get io () {
    return this.ensureProp(this._io, 'startListening')
  }

  toReporter (event: string, data?: any) {
    return this.io && this.io.to('reporter').emit(event, data)
  }

  toRunner (event: string, data?: any) {
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

  createIo (server: DestroyableHttpServer, path: string, cookie: string | boolean) {
    return new socketIo.SocketIOServer(server, {
      path,
      cookie: {
        name: cookie,
      },
      destroyUpgrade: false,
      serveClient: false,
      transports: ['websocket'],
    })
  }

  startListening (
    server: DestroyableHttpServer,
    automation,
    config,
    options,
    callbacks: StartListeningCallbacks,
  ) {
    let existingState = null

    _.defaults(options, {
      socketId: null,
      onResetServerState () {},
      onTestsReceivedAndMaybeRecord () {},
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

    let automationClient

    const { socketIoRoute, socketIoCookie } = config

    this._io = this.createIo(server, socketIoRoute, socketIoCookie)

    automation.use({
      onPush: (message, data) => {
        return this.io.emit('automation:push:message', message, data)
      },
    })

    const onAutomationClientRequestCallback = (message, data, id) => {
      return this.onAutomation(automationClient, message, data, id)
    }

    const automationRequest = (message: string, data: Record<string, unknown>) => {
      return automation.request(message, data, onAutomationClientRequestCallback)
    }

    const getFixture = (path, opts) => fixture.get(config.fixturesFolder, path, opts)

    this.io.on('connection', (socket: any) => {
      debug('socket connected')

      // cache the headers so we can access
      // them at any time
      const headers = socket.request?.headers ?? {}

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
            return this.io.emit('automation:disconnected')
          })
        })

        socket.on('automation:push:request', (
          message: string,
          data: Record<string, unknown>,
          cb: (...args: unknown[]) => any,
        ) => {
          automation.push(message, data)

          // just immediately callback because there
          // is not really an 'ack' here
          if (cb) {
            return cb()
          }
        })

        socket.on('automation:response', automation.response)
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

      // TODO: what to do about runner disconnections?

      socket.on('spec:changed', (spec) => {
        return options.onSpecChanged(spec)
      })

      socket.on('app:connect', (socketId) => {
        return options.onConnect(socketId, socket)
      })

      socket.on('set:runnables:and:maybe:record:tests', async (runnables, cb) => {
        return options.onTestsReceivedAndMaybeRecord(runnables, cb)
      })

      socket.on('mocha', (...args: unknown[]) => {
        return options.onMocha.apply(options, args)
      })

      socket.on('open:finder', (p, cb = function () {}) => {
        return open.opn(p)
        .then(() => {
          return cb()
        })
      })

      socket.on('recorder:frame', (data) => {
        return options.onCaptureVideoFrames(data)
      })

      socket.on('reload:browser', (url: string, browser: any) => {
        return options.onReloadBrowser(url, browser)
      })

      socket.on('focus:tests', () => {
        return options.onFocusTests()
      })

      socket.on('is:automation:client:connected', (
        data: Record<string, any>,
        cb: (...args: unknown[]) => void,
      ) => {
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
        }).catch(Bluebird.TimeoutError, (_err) => {
          return cb(false)
        })
      })

      socket.on('backend:request', (eventName: string, ...args) => {
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
            case 'log:memory:pressure':
              return firefoxUtil.log()
            case 'firefox:force:gc':
              return firefoxUtil.collectGarbage()
            case 'get:fixture':
              return getFixture(args[0], args[1])
            case 'read:file':
              return files.readFile(config.projectRoot, args[0], args[1])
            case 'write:file':
              return files.writeFile(config.projectRoot, args[0], args[1], args[2])
            case 'net':
              return onNetEvent({
                eventName: args[0],
                frame: args[1],
                state: options.netStubbingState,
                socket: this,
                getFixture,
                args,
              })
            case 'exec':
              return exec.run(config.projectRoot, args[0])
            case 'task':
              return task.run(config.pluginsFile, args[0])
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
        const s = existingState

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

      socket.on('external:open', (url: string) => {
        debug('received external:open %o', { url })
        // using this instead of require('electron').shell.openExternal
        // because CT runner does not spawn an electron shell
        // if we eventually decide to exclusively launch CT from
        // the desktop-gui electron shell, we should update this to use
        // electron.shell.openExternal.

        // cross platform way to open a new tab in default browser, or a new browser window
        // if one does not already exist for the user's default browser.
        const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open')

        return require('child_process').exec(`${start} ${url}`)
      })

      socket.on('get:user:editor', (cb) => {
        getUserEditor(false)
        .then(cb)
      })

      socket.on('set:user:editor', (editor) => {
        setUserEditor(editor)
      })

      socket.on('open:file', (fileDetails) => {
        openFile(fileDetails)
      })

      reporterEvents.forEach((event) => {
        socket.on(event, (data) => {
          this.toRunner(event, data)
        })
      })

      runnerEvents.forEach((event) => {
        socket.on(event, (data) => {
          this.toReporter(event, data)
        })
      })

      callbacks.onSocketConnection(socket)
    })

    return this.io
  }

  end () {
    this.ended = true

    // TODO: we need an 'ack' from this end
    // event from the other side
    return this.io.emit('tests:finished')
  }

  changeToUrl (url) {
    return this.toRunner('change:to:url', url)
  }

  close () {
    return this.io.close()
  }
}
