/* eslint-disable no-console */
// sockjs is used by webpack-dev-server as default socket client
import SockJS from 'sockjs-client/dist/sockjs'
import stripAnsi from 'strip-ansi'

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
    },
    warnings: (warnings) => {
      console.warn('Warnings while compiling.')
      warnings.forEach(
        (warning) => console.warn(stripAnsi(warning)),
      )

      onReload()
    },
    errors: (errors) => {
      console.error('Errors while compiling. Reload prevented.')

      errors.forEach(
        (warning) => console.warn(stripAnsi(warning)),
      )
    },
  }

  const socketClient = new SockJS(url)

  socketClient.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data)

    if (handlersMap[type]) {
      handlersMap[type](data)
    }
  }

  socketClient.onclose = () => {
    console.error('Webpack HMR disconnected.')
  }

  return socketClient
}

export function closeWebpackHmr (socket: SockJS) {
  socket.close()
}
