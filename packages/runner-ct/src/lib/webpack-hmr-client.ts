/* eslint-disable no-console */
import stripAnsi from 'strip-ansi'
import SockJS from 'sockjs-client/dist/sockjs' // sockjs is used by webpack-dev-server as default socket client
import eventManager from './event-manager'

export interface WebpackHmrClientOptions {
  url: string
  onReload: () => void
}

/**
 * Custom connection to the webpack HMR socket
 * Reference: https://github.com/webpack/webpack-dev-server/tree/master/client-src
 */
export function connectWebpackHmr ({ url, onReload }) {
  const handlersMap = {
    invalid: () => {
      console.log('Spec updated. Recompiling...')
    },
    'still-ok': () => {
      console.log('Nothing changed.')
    },
    'ok': () => {
      onReload()

      // in the scenario a test has not been selected,
      // just clear the error overlay to vusually indicate to the user
      // that all the errors have been resolved.
      eventManager.emit('script:error', null)
    },
    warnings: (warnings) => {
      console.warn('Warnings while compiling.')
      warnings.forEach(
        (warning) => console.warn(stripAnsi(warning)),
      )

      onReload()
    },
    errors: (errors: string[]) => {
      console.error('Errors while compiling. Reload prevented.')

      errors.forEach(
        (warning) => console.warn(stripAnsi(warning)),
      )

      eventManager.emit('script:error', { error: errors[0] })
    },
  }

  const socketClient = new SockJS(url)

  socketClient.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data)

    if (handlersMap[type]) {
      handlersMap[type](data)
    }
  }

  socketClient.onclose = (e) => {
    console.error('Webpack HMR disconnected.')
  }

  return socketClient
}

export function closeWebpackHmr (socket: SockJS) {
  socket.close()
}
