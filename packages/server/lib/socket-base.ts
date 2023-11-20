import Bluebird from 'bluebird'
import Debug from 'debug'
import EventEmitter from 'events'
import _ from 'lodash'
import { getCtx } from '@packages/data-context'
import { handleGraphQLSocketRequest } from '@packages/graphql/src/makeGraphQLServer'
import { onNetStubbingEvent } from '@packages/net-stubbing'
import * as socketIo from '@packages/socket'
import { CDPSocketServer } from '@packages/socket/lib/cdp-socket'

import firefoxUtil from './browsers/firefox-util'
import * as errors from './errors'
import fixture from './fixture'
import { ensureProp } from './util/class-helpers'
import { getUserEditor, setUserEditor } from './util/editors'
import { openFile, OpenFileDetails } from './util/file-opener'
import open from './util/open'
import type { DestroyableHttpServer } from './util/server_destroy'
import * as session from './session'
import { cookieJar, SameSiteContext, automationCookieToToughCookie, SerializableAutomationCookie } from './util/cookies'
import runEvents from './plugins/run_events'
import type { OTLPTraceExporterCloud } from '@packages/telemetry'
import { telemetry } from '@packages/telemetry'

// eslint-disable-next-line no-duplicate-imports
import type { Socket } from '@packages/socket'

import type { RunState, CachedTestState, ProtocolManagerShape } from '@packages/types'
import { cors } from '@packages/network'
import memory from './browsers/memory'
import { privilegedCommandsManager } from './privileged-commands/privileged-commands-manager'

type StartListeningCallbacks = {
  onSocketConnection: (socket: any) => void
}

const debug = Debug('cypress:server:socket-base')

const retry = (fn: (res: any) => void) => {
  return Bluebird.delay(25).then(fn)
}

export class SocketBase {
  private _sendResetBrowserTabsForNextTestMessage
  private _sendResetBrowserStateMessage
  private _isRunnerSocketConnected
  private _sendFocusBrowserMessage
  private _protocolManager?: ProtocolManagerShape

  protected inRunMode: boolean
  protected supportsRunEvents: boolean
  protected ended: boolean
  protected _socketIo?: socketIo.SocketIOServer
  protected _cdpIo?: CDPSocketServer
  localBus: EventEmitter

  constructor (config: Record<string, any>) {
    this.inRunMode = config.isTextTerminal
    this.supportsRunEvents = config.isTextTerminal || config.experimentalInteractiveRunEvents
    this.ended = false
    this.localBus = new EventEmitter()
  }

  protected ensureProp = ensureProp

  get socketIo () {
    return this.ensureProp(this._socketIo, 'startListening')
  }

  get cdpIo () {
    return this._cdpIo
  }

  getIos () {
    return [this._cdpIo, this._socketIo]
  }

  toRunner (event: string, data?: any) {
    this.getIos().forEach((io) => {
      io?.to('runner').emit(event, data)
    })
  }

  isSocketConnected (socket) {
    return socket && socket.connected
  }

  toDriver (event, ...data) {
    this.getIos().forEach((io) => {
      io?.emit(event, ...data)
    })
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

  createCDPIo (socketIoRoute: string) {
    return new CDPSocketServer({ path: socketIoRoute })
  }

  createSocketIo (server: DestroyableHttpServer, path: string, cookie: string | boolean) {
    return new socketIo.SocketIOServer(server, {
      path,
      cookie: {
        name: cookie,
      },
      destroyUpgrade: false,
      serveClient: false,
      // TODO(webkit): the websocket socket.io transport is busted in WebKit, need polling
      transports: ['websocket', 'polling'],
    })
  }

  startListening (
    server: DestroyableHttpServer,
    automation,
    config,
    options,
    callbacks: StartListeningCallbacks,
  ) {
    let runState: RunState | undefined = undefined

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
      closeExtraTargets () {},
      onSavedStateChanged () {},
      onTestFileChange () {},
      onCaptureVideoFrames () {},
    })

    let automationClient
    let runnerSocket

    const { socketIoRoute, socketIoCookie } = config

    const socketIo = this._socketIo = this.createSocketIo(server, socketIoRoute, socketIoCookie)
    const cdpIo = this._cdpIo = this.createCDPIo(socketIoRoute)

    automation.use({
      onPush: (message, data) => {
        socketIo.emit('automation:push:message', message, data)
        cdpIo.emit('automation:push:message', message, data)
      },
    })

    const resetRenderedHTMLOrigins = () => {
      const origins = options.getRenderedHTMLOrigins()

      Object.keys(origins).forEach((key) => delete origins[key])
    }

    const onAutomationClientRequestCallback = (message, data, id) => {
      return this.onAutomation(automationClient, message, data, id)
    }

    const automationRequest = (message: string, data: Record<string, unknown>) => {
      return automation.request(message, data, onAutomationClientRequestCallback)
    }

    const getFixture = (path, opts) => fixture.get(config.fixturesFolder, path, opts)

    this.getIos().forEach((io) => {
      io?.on('connection', (socket: Socket & { inReporterRoom?: boolean, inRunnerRoom?: boolean }) => {
        if (socket.conn && socket.conn.transport.name === 'polling' && options.getCurrentBrowser()?.family !== 'webkit') {
          debug('polling WebSocket request received with non-WebKit browser, disconnecting')

          // TODO(webkit): polling transport is only used for experimental WebKit, and it bypasses SocketAllowed,
          // we d/c polling clients if we're not in WK. remove once WK ws proxying is fixed
          return socket.disconnect(true)
        }

        debug('socket connected')

        socket.on('disconnecting', (reason) => {
          debug(`socket-disconnecting ${reason}`)
        })

        socket.on('disconnect', (reason) => {
          debug(`socket-disconnect ${reason}`)
        })

        socket.on('error', (err) => {
          debug(`socket-error ${err.message}`)
        })

        socket.on('automation:client:connected', () => {
          const connectedBrowser = getCtx().coreData.activeBrowser

          if (automationClient === socket) {
            return
          }

          automationClient = socket

          debug('automation:client connected')

          // only send the necessary config
          automationClient.emit('automation:config', {})

          // if our automation disconnects then we're
          // in trouble and should probably bomb everything
          automationClient.on('disconnect', () => {
            const { activeBrowser } = getCtx().coreData

            // if we've stopped or if we've switched to another browser then don't do anything
            if (this.ended || (connectedBrowser?.path !== activeBrowser?.path)) {
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
              io?.emit('automation:disconnected')
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
            return cb({ error: errors.cloneErr(err) })
          })
        })

        this._sendResetBrowserTabsForNextTestMessage = async (shouldKeepTabOpen: boolean) => {
          await automationRequest('reset:browser:tabs:for:next:test', { shouldKeepTabOpen })
        }

        this._sendResetBrowserStateMessage = async () => {
          await automationRequest('reset:browser:state', {})
        }

        this._sendFocusBrowserMessage = async () => {
          await automationRequest('focus:browser:window', {})
        }

        this._isRunnerSocketConnected = () => {
          return !!(runnerSocket && runnerSocket.connected)
        }

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

          runnerSocket = socket

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

          // retry for up to data.timeout or 1 second
          return Bluebird
          .try(tryConnected)
          .timeout(data.timeout != null ? data.timeout : 1000)
          .then(() => {
            return cb(true)
          }).catch(Bluebird.TimeoutError, (_err) => {
            return cb(false)
          })
        })

        const setCrossOriginCookie = ({ cookie, url, sameSiteContext }: { cookie: SerializableAutomationCookie, url: string, sameSiteContext: SameSiteContext }) => {
          const domain = cors.getOrigin(url)

          cookieJar.setCookie(automationCookieToToughCookie(cookie, domain), url, sameSiteContext)
        }

        socket.on('backend:request', (eventName: string, ...args) => {
          const userAgent = socket.request?.headers['user-agent'] || getCtx().coreData.app.browserUserAgent

          // cb is always the last argument
          const cb = args.pop()

          debug('backend:request %o', { eventName, args })

          const backendRequest = () => {
            switch (eventName) {
              case 'preserve:run:state':
                runState = args[0]

                return null
              case 'resolve:url': {
                const [url, resolveOpts] = args

                return options.onResolveUrl(url, userAgent, automationRequest, resolveOpts)
              }
              case 'http:request':
                return options.onRequest(userAgent, automationRequest, args[0])
              case 'reset:server:state':
                return options.onResetServerState()
              case 'log:memory:pressure':
                return firefoxUtil.log()
              case 'firefox:force:gc':
                return firefoxUtil.collectGarbage()
              case 'get:fixture':
                return getFixture(args[0], args[1])
              case 'net':
                return onNetStubbingEvent({
                  eventName: args[0],
                  frame: args[1],
                  state: options.netStubbingState,
                  socket: this,
                  getFixture,
                  args,
                })
              case 'save:session':
                return session.saveSession(args[0])
              case 'clear:sessions':
                return session.clearSessions(args[0])
              case 'get:session':
                return session.getSession(args[0])
              case 'reset:cached:test:state':
                runState = undefined
                cookieJar.removeAllCookies()
                session.clearSessions()

                return resetRenderedHTMLOrigins()
              case 'get:rendered:html:origins':
                return options.getRenderedHTMLOrigins()
              case 'reset:rendered:html:origins':
                return resetRenderedHTMLOrigins()
              case 'cross:origin:cookies:received':
                return this.localBus.emit('cross:origin:cookies:received')
              case 'cross:origin:set:cookie':
                return setCrossOriginCookie(args[0])
              case 'request:sent:with:credentials':
                return this.localBus.emit('request:sent:with:credentials', args[0])
              case 'start:memory:profiling':
                return memory.startProfiling(automation, args[0])
              case 'end:memory:profiling':
                return memory.endProfiling()
              case 'check:memory:pressure':
                return memory.checkMemoryPressure({ ...args[0], automation })
              case 'protocol:test:before:run:async':
                return this._protocolManager?.beforeTest(args[0])
              case 'protocol:test:before:after:run:async':
                return this._protocolManager?.preAfterTest(args[0], args[1])
              case 'protocol:test:after:run:async':
                return this._protocolManager?.afterTest(args[0])
              case 'protocol:command:log:added':
                return this._protocolManager?.commandLogAdded(args[0])
              case 'protocol:command:log:changed':
                return this._protocolManager?.commandLogChanged(args[0])
              case 'protocol:viewport:changed':
                return this._protocolManager?.viewportChanged(args[0])
              case 'protocol:url:changed':
                return this._protocolManager?.urlChanged(args[0])
              case 'protocol:page:loading':
                return this._protocolManager?.pageLoading(args[0])
              case 'run:privileged':
                return privilegedCommandsManager.runPrivilegedCommand(config, args[0])
              case 'telemetry':
                return (telemetry.exporter() as OTLPTraceExporterCloud)?.send(args[0], () => {}, (err) => {
                  debug('error exporting telemetry data from browser %s', err)
                })
              case 'close:extra:targets':
                return options.closeExtraTargets()
              default:
                throw new Error(`You requested a backend event we cannot handle: ${eventName}`)
            }
          }

          return Bluebird.try(backendRequest)
          .then((resp) => {
            return cb({ response: resp })
          }).catch((err) => {
            return cb({ error: errors.cloneErr(err) })
          })
        })

        socket.on('get:cached:test:state', (cb: (runState: RunState | null, testState: CachedTestState) => void) => {
          const s = runState

          const cachedTestState: CachedTestState = {
            activeSessions: session.getActiveSessions(),
          }

          if (s) {
            runState = undefined

            // if we have cached test state, then we need to reset
            // the test state on the protocol manager
            if (s.currentId) {
              this._protocolManager?.resetTest(s.currentId)
            }
          }

          return cb(s || {}, cachedTestState)
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
          .catch(() => {})
        })

        socket.on('set:user:editor', (editor) => {
          setUserEditor(editor).catch(() => {})
        })

        socket.on('open:file', async (fileDetails: OpenFileDetails) => {
          // todo(lachlan): post 10.0 we should not pass the
          // editor (in the `fileDetails.where` key) from the
          // front-end, but rather rely on the server context
          // to grab the preferred editor, like I'm doing here,
          // so we do not need to
          // maintain two sources of truth for the preferred editor
          // adding this conditional to maintain backwards compat with
          // existing runner and reporter API.
          fileDetails.where = {
            binary: getCtx().coreData.localSettings.preferences.preferredEditorBinary || 'computer',
          }

          debug('opening file %o', fileDetails)

          openFile(fileDetails)
        })

        if (this.supportsRunEvents) {
          socket.on('plugins:before:spec', (spec, cb) => {
            const beforeSpecSpan = telemetry.startSpan({ name: 'lifecycle:before:spec' })

            beforeSpecSpan?.setAttributes({ spec })

            runEvents.execute('before:spec', spec)
            .then(cb)
            .catch((error) => {
              if (this.inRunMode) {
                socket.disconnect()
                throw error
              }

              // surfacing the error to the app in open mode
              cb({ error })
            })
            .finally(() => {
              beforeSpecSpan?.end()
            })
          })
        }

        callbacks.onSocketConnection(socket)

        return
      })
    })

    this.getIos().forEach((io) => {
      io?.of('/data-context').on('connection', (socket: Socket) => {
        socket.on('graphql:request', handleGraphQLSocketRequest)
      })
    })

    return {
      cdpIo: this._cdpIo,
      socketIo: this._socketIo,
    }
  }

  end () {
    this.ended = true

    // TODO: we need an 'ack' from this end
    // event from the other side
    this.getIos().forEach((io) => {
      io?.emit('tests:finished')
    })
  }

  async resetBrowserTabsForNextTest (shouldKeepTabOpen: boolean) {
    if (this._sendResetBrowserTabsForNextTestMessage) {
      await this._sendResetBrowserTabsForNextTestMessage(shouldKeepTabOpen)
    }
  }

  async resetBrowserState () {
    if (this._sendResetBrowserStateMessage) {
      await this._sendResetBrowserStateMessage()
    }
  }

  isRunnerSocketConnected () {
    if (this._isRunnerSocketConnected) {
      return this._isRunnerSocketConnected()
    }
  }

  async sendFocusBrowserMessage () {
    await this._sendFocusBrowserMessage()
  }

  close () {
    this.getIos().forEach((io) => io?.close())
  }

  changeToUrl (url: string) {
    return this.toRunner('change:to:url', url)
  }

  /**
   * Sends the new telemetry context to the browser
   * @param context - telemetry context string
   * @returns
   */
  updateTelemetryContext (context: string) {
    return this.toRunner('update:telemetry:context', context)
  }

  setProtocolManager (protocolManager: ProtocolManagerShape | undefined) {
    this._protocolManager = protocolManager
  }
}
