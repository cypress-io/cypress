import debugModule from 'debug'
import _ from 'lodash'
import type { ChildProcess } from 'child_process'
import CRI from 'chrome-remote-interface'
import * as errors from '../errors'
import mime from 'mime'
import check from 'check-more-types'
import la from 'lazy-ass'

const debug = debugModule('cypress:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:send:[-->]')
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:recv:[<--]')

const WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/

/**
 * Url returned by the Chrome Remote Interface
*/
type websocketUrl = string

/**
 * Wrapper for Chrome Remote Interface client. Only allows "send" method.
 * @see https://github.com/cyrus-and/chrome-remote-interface#clientsendmethod-params-callback
*/
export interface Client {
  navigate(url): Promise<void>
  handleDownloads(dir, automation): Promise<void>
  /**
   * The target id attached to by this client
   */
  targetId: string
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
   */
  send (command: string, params?: object): Promise<any>
  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on (eventName: string, cb: Function): void
  /**
   * Calls underlying remote interface client close
   */
  close (): Promise<void>
}

const maybeDebugCdpMessages = (cri) => {
  if (debugVerboseReceive.enabled) {
    const handleMessage = cri._handleMessage

    cri._handleMessage = (message) => {
      const formatted = _.cloneDeep(message)

      ;([
        'params.data', // screencast frame data
        'result.data', // screenshot data
      ]).forEach((truncatablePath) => {
        const str = _.get(formatted, truncatablePath)

        if (!_.isString(str)) {
          return
        }

        _.set(formatted, truncatablePath, _.truncate(str, {
          length: 100,
          omission: `... [truncated string of total bytes: ${str.length}]`,
        }))
      })

      debugVerboseReceive('received CDP message %o', formatted)

      return handleMessage.call(cri, message)
    }
  }

  if (debugVerboseSend.enabled) {
    const send = cri._send

    cri._send = (data, callback) => {
      debugVerboseSend('sending CDP command %o', JSON.parse(data))

      return send.call(cri, data, callback)
    }
  }
}

type DeferredPromise = { resolve: Function, reject: Function }

type CreateOpts = {
  target: websocketUrl
  process?: ChildProcess
  host?: string
  port?: number
  onReconnect?: (client: Client) => void
  onAsynchronousError: Function
}

type Message = {
  method: string
  params?: any
  sessionId?: string
}

export const create = async (opts: CreateOpts): Promise<Client> => {
  const subscriptions: {eventName: string, cb: Function}[] = []
  const enableCommands: string[] = []
  let enqueuedCommands: {message: Message, params: any, p: DeferredPromise }[] = []

  let closed = false // has the user called .close on this?
  let connected = false // is this currently connected to CDP?

  let cri
  let client: Client
  let sessionId: string | undefined

  const reconnect = async () => {
    if (opts.process) {
      // reconnecting doesn't make sense for stdio
      opts.onAsynchronousError(errors.get('CDP_STDIO_ERROR'))

      return
    }

    debug('disconnected, attempting to reconnect... %o', { closed })

    connected = false

    if (closed) {
      enqueuedCommands = []

      return
    }

    try {
      await connect()

      debug('restoring subscriptions + running *.enable and queued commands... %o', { subscriptions, enableCommands, enqueuedCommands })

      // '*.enable' commands need to be resent on reconnect or any events in
      // that namespace will no longer be received
      await Promise.all(enableCommands.map((cmdName) => {
        return cri.send(cmdName)
      }))

      subscriptions.forEach((sub) => {
        cri.on(sub.eventName, sub.cb)
      })

      enqueuedCommands.forEach((cmd) => {
        cri.sendRaw(cmd.message)
        .then(cmd.p.resolve, cmd.p.reject)
      })

      enqueuedCommands = []

      if (opts.onReconnect) {
        opts.onReconnect(client)
      }
    } catch (err) {
      const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', err)

      // If we cannot reconnect to CDP, we will be unable to move to the next set of specs since we use CDP to clean up and close tabs. Marking this as fatal
      cdpError.isFatalApiErr = true
      opts.onAsynchronousError(cdpError)
    }
  }

  const connect = async () => {
    await cri?.close()

    debug('connecting %o', opts)

    cri = await CRI({
      ...opts,
      local: true,
    })

    connected = true

    maybeDebugCdpMessages(cri)

    // @see https://github.com/cyrus-and/chrome-remote-interface/issues/72
    cri._notifier.on('disconnect', reconnect)

    if (opts.process) {
      // if using stdio, we need to find the target before declaring the connection complete
      return findTarget()
    }

    return
  }

  const findTarget = async () => {
    debug('finding CDP target...')

    return

    // return new Promise<void>((resolve, reject) => {
    //   const isAboutBlank = (target) => target.type === 'page' && target.url === 'about:blank'

    //   const attachToTarget = _.once(({ targetId }) => {
    //     debug('attaching to target %o', { targetId })
    //     cri.send('Target.attachToTarget', {
    //       targetId,
    //       flatten: true, // enable selecting via sessionId
    //     }).then((result) => {
    //       debug('attached to target %o', result)
    //       sessionId = result.sessionId
    //       resolve()
    //     }).catch(reject)
    //   })

    //   cri.send('Target.setDiscoverTargets', { discover: true })
    //   .then(() => {
    //     cri.on('Target.targetCreated', (target) => {
    //       if (isAboutBlank(target)) {
    //         attachToTarget(target)
    //       }
    //     })

    //     return cri.send('Target.getTargets')
    //     .then(({ targetInfos }) => targetInfos.filter(isAboutBlank).map(attachToTarget))
    //   })
    //   .catch(reject)
    // })
  }

  await connect()

  client = {
    targetId: opts.target,
    async navigate (url) {
      // @ts-ignore
      la(check.url(url), 'missing url to navigate to', url)
      la(client, 'could not get CRI client')
      debug('received CRI client')
      debug('navigating to page %s', url)

      // when opening the blank page and trying to navigate
      // the focus gets lost. Restore it and then navigate.
      await client.send('Page.bringToFront')
      await client.send('Page.navigate', { url })
    },
    async handleDownloads (dir, automation) {
      client.on('Page.downloadWillBegin', (data) => {
        const downloadItem = {
          id: data.guid,
          url: data.url,
        }

        const filename = data.suggestedFilename

        if (filename) {
          // @ts-ignore
          downloadItem.filePath = path.join(dir, data.suggestedFilename)
          // @ts-ignore
          downloadItem.mime = mime.getType(data.suggestedFilename)
        }

        automation.push('create:download', downloadItem)
      })

      client.on('Page.downloadProgress', (data) => {
        if (data.state !== 'completed') return

        automation.push('complete:download', {
          id: data.guid,
        })
      })

      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: dir,
      })
    },
    async send (command: string, params?: object) {
      const message: Message = {
        method: command,
        params,
      }

      if (sessionId) {
        message.sessionId = sessionId
      }

      const enqueue = () => {
        return new Promise((resolve, reject) => {
          enqueuedCommands.push({ message, params, p: { resolve, reject } })
        })
      }

      // Keep track of '*.enable' commands so they can be resent when
      // reconnecting
      if (command.endsWith('.enable')) {
        enableCommands.push(command)
      }

      if (connected) {
        try {
          return await cri.sendRaw(message)
        } catch (err) {
          // This error occurs when the browser has been left open for a long
          // time and/or the user's computer has been put to sleep. The
          // socket disconnects and we need to recreate the socket and
          // connection
          if (!WEBSOCKET_NOT_OPEN_RE.test(err.message)) {
            throw err
          }

          debug('encountered closed websocket on send %o', { command, params, err })

          const p = enqueue()

          await reconnect()

          return p
        }
      }

      return enqueue()
    },
    on (eventName, cb) {
      subscriptions.push({ eventName, cb })
      debug('registering CDP on event %o', { eventName })

      return cri.on(eventName, cb)
    },
    close () {
      closed = true

      return cri.close()
    },
  }

  return client
}
