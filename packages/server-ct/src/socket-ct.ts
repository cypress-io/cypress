// copied from server/lib/socket.js

import Bluebird from 'bluebird'
import _debug from 'debug'
import _ from 'lodash'
import errors from '@packages/server/lib/errors'
import { getUserEditor, setUserEditor } from '@packages/server/lib/util/editors'
import { openFile } from '@packages/server/lib/util/file-opener'
import open from '@packages/server/lib/util/open'
import * as netStubbing from '@packages/net-stubbing'
import { GetFixtureFn } from '@packages/net-stubbing/lib/server/types'
import * as fixture from '@packages/server/lib/fixture'
import socketIo from '@packages/socket'

const debug = _debug('cypress:server-ct:socket')

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

const retry = (fn: (res: any) => void) => {
  return Bluebird.delay(25).then(fn)
}

export class Socket {
  private ended: boolean
  private io: socketIo.Server
  private testsDir: string[]

  constructor (config: Record<string, any>) {
    this.ended = false

    this.onTestFileChange = this.onTestFileChange.bind(this)
  }

  onTestFileChange (filePath: string) {
    debug('test file changed %o', filePath)
  }

  toReporter (event: string, data: any) {
    return this.io && this.io.to('reporter').emit(event, data)
  }

  toRunner (event: string, data: any) {
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

  createIo (server: number, path: string, cookie: string | boolean) {
    return socketIo.server(server, {
      path,
      destroyUpgrade: false,
      serveClient: false,
      cookie,
      parser: socketIo.circularParser as any,
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

    const automationRequest = (_message: string, _data: Record<string, unknown>) => {
      // return automation.request(message, data, onAutomationClientRequestCallback)
    }

    return this.io.on('connection', (socket: any) => {
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

        socket.on('automation:push:request', (_message: string, _data: Record<string, unknown>, cb: (...args: unknown[]) => any) => {
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

      socket.on('message', () => {
        console.log('MEssage...')
      })

      socket.on('runner:connected', () => {
        if (socket.inRunnerRoom) {
          return
        }

        socket.inRunnerRoom = true

        return socket.join('runner')
      })

      // TODO: what to do about runner disconnections?

      socket.on('spec:changed', (spec) => {
        console.log('SPEC CHANGED!!!!')

        return options.onSpecChanged(spec)
      })

      socket.on('app:connect', (socketId) => {
        return options.onConnect(socketId, socket)
      })

      socket.on('set:runnables', (runnables, cb) => {
        options.onSetRunnables(runnables)

        return cb()
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

      socket.on('reload:browser', (url: string, browser: any) => {
        return options.onReloadBrowser(url, browser)
      })

      socket.on('focus:tests', () => {
        return options.onFocusTests()
      })

      socket.on('is:automation:client:connected', (data: Record<string, any>, cb: (...args: unknown[]) => void) => {
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
        }).catch(Bluebird.TimeoutError, () => {
          return cb(false)
        })
      })

      socket.on('backend:request', (eventName: string, ...args) => {
        // cb is always the last argument
        const cb = args.pop()

        debug('backend:request %o', { eventName, args })
        const getFixture: GetFixtureFn = (path, opts) => fixture.get(config.fixturesFolder, path, opts)

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
            case 'net':
              return netStubbing.onNetEvent({
                eventName: args[0],
                frame: args[1],
                state: options.netStubbingState,
                socket: this,
                getFixture,
                args,
              })
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

      socket.on('external:open', (url) => {
        debug('received external:open %o', { url })

        return require('electron').shell.openExternal(url)
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

  sendSpecList (specs) {
    this.toRunner('component:specs:changed', specs)
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
