import Debug from 'debug'
import _ from 'lodash'
import type CDP from 'chrome-remote-interface'
import type EventEmitter from 'events'
import type WebSocket from 'ws'

export interface DebuggableCDPClient extends CDP.Client {
  off: EventEmitter['off']
  // ws is defined as optional here, because it is not a declared public property of
  // CDP.Client - it may be removed in future minor/patch versions
  _ws?: WebSocket
}

export const debugCdpConnection = (namespace: string, cri: DebuggableCDPClient) => {
  // debug using cypress-verbose:server:browsers:cri-client:send:*
  const debugVerboseSend = Debug(`${namespace}:send:[-->]`)
  // debug using cypress-verbose:server:browsers:cri-client:recv:*
  const debugVerboseReceive = Debug(`${namespace}:recv:[<--]`)
  // debug using cypress-verbose:server:browsers:cri-client:err:*
  const debugVerboseLifecycle = Debug(`${namespace}:ws`)

  if (debugVerboseReceive.enabled) {
    cri._ws?.prependListener('message', (data) => {
      data = _
      .chain(JSON.parse(data))
      .tap((data) => {
        ([
          'params.data', // screencast frame data
          'result.data', // screenshot data
        ]).forEach((truncatablePath) => {
          const str = _.get(data, truncatablePath)

          if (!_.isString(str)) {
            return
          }

          _.set(data, truncatablePath, _.truncate(str, {
            length: 100,
            omission: `... [truncated string of total bytes: ${str.length}]`,
          }))
        })

        return data
      })
      .value()

      debugVerboseReceive('received CDP message %o', data)
    })
  }

  if (debugVerboseSend.enabled) {
    if (cri._ws) {
      const send = cri._ws?.send

      cri._ws.send = (data, callback) => {
        debugVerboseSend('sending CDP command %o', JSON.parse(data))

        try {
          return send.call(cri._ws, data, callback)
        } catch (e: any) {
          debugVerboseSend('Error sending CDP command %o %O', JSON.parse(data), e)
          throw e
        }
      }
    }
  }

  if (debugVerboseLifecycle.enabled) {
    cri._ws?.addEventListener('open', (event) => {
      debugVerboseLifecycle(`[OPEN] %o`, event)
    })

    cri._ws?.addEventListener('close', (event) => {
      debugVerboseLifecycle(`[CLOSE] %o`, event)
    })

    cri._ws?.addEventListener('error', (event) => {
      debugVerboseLifecycle(`[ERROR] %o`, event)
    })
  }
}
