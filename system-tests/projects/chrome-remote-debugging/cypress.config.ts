let port = 0
let portWasAlreadySet = false
let socket: WebSocket | null = null
let lastMessageId = 0

// Driven with the `fetch` and `WebSocket` globals so this project needs no
// `node_modules` of its own.
const getSocket = async () => {
  if (socket?.readyState === WebSocket.OPEN) {
    return socket
  }

  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((res) => res.json())
  const page = targets.find((target) => target.type === 'page')

  if (!page) {
    throw new Error(`No page target is listening on remote debugging port ${port}`)
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl)

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  socket = ws

  return socket
}

const send = async (method: string, params = {}) => {
  const ws = await getSocket()
  const id = ++lastMessageId

  return new Promise<any>((resolve, reject) => {
    const controller = new AbortController()
    const { signal } = controller

    // Without these, a socket that dies mid-request leaves the task hanging
    // until Cypress's task timeout reports something unrelated.
    const onClosed = () => {
      controller.abort()
      reject(new Error(`CDP connection closed while waiting for ${method}`))
    }

    ws.addEventListener('message', (event: MessageEvent) => {
      const message = JSON.parse(event.data)

      if (message.id !== id) {
        return
      }

      controller.abort()

      if (message.error) {
        reject(new Error(message.error.message))

        return
      }

      resolve(message.result)
    }, { signal })

    ws.addEventListener('close', onClosed, { signal })
    ws.addEventListener('error', onClosed, { signal })

    ws.send(JSON.stringify({ id, method, params }))
  })
}

export default {
  fixturesFolder: false,
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('before:browser:launch', (browser, launchOptions) => {
        // Only the return value of this handler crosses back from the forked
        // config process, so mutating `args` here would be discarded. Cypress
        // always supplies the port, so this reads it rather than adding one.
        const rdpArg = launchOptions.args.find((arg) => arg.startsWith('--remote-debugging-port='))

        portWasAlreadySet = Boolean(rdpArg)
        port = Number(rdpArg?.split('=')[1])
      })

      on('task', {
        disconnectCdp: async () => {
          if (!socket) {
            return null
          }

          const ws = socket
          const closed = new Promise((resolve) => ws.addEventListener('close', resolve, { once: true }))

          socket = null
          ws.close()

          await closed

          return null
        },

        launchArgsState: async () => {
          return {
            port,
            portWasAlreadySet,
            portFromEnv: process.env.CYPRESS_REMOTE_DEBUGGING_PORT,
          }
        },

        cdpBrowserProduct: async () => {
          const { product } = await send('Browser.getVersion')

          return product
        },

        activatePrintMediaQuery: async () => {
          await send('Emulation.setEmulatedMedia', { media: 'print' })

          return null
        },
      })
    },
  },
}
