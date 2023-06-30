const la = require('lazy-ass')
const net = require('net')

const realPort = process.env.CYPRESS_REMOTE_DEBUGGING_PORT
const fakePort = 17171

let currentConnectionCount = 0
let totalConnectionCount = 0

let server

// this is a transparent TCP proxy for Chrome's debugging port
// it can kill all existing connections or shut the port down independently of Chrome or Cypress
const startTcpProxy = () => {
  console.error('starting tcp proxy ', { realPort, fakePort })

  return new Promise((resolve, reject) => {
    server = net.createServer((socket) => {
      const { remotePort } = socket

      console.error('received connection from ', { remotePort })

      const upstreamSocket = net.connect(fakePort, () => {
        console.error('hooked to upstream', { remotePort })

        totalConnectionCount++
        currentConnectionCount++

        server.on('kill-active-connections', () => {
          console.error('destroying', { remotePort })
          socket.destroy()
        })

        socket.on('close', () => {
          currentConnectionCount--
        })

        socket.pipe(upstreamSocket)
        upstreamSocket.pipe(socket)
      })

      upstreamSocket.on('error', (err) => {
        console.error('error on upstream', { remotePort })
        socket.destroy()
      })
    })

    server.listen(realPort, resolve)
    server.on('error', reject)
  })
}

module.exports = (on, config) => {
  on('before:browser:launch', (browser = {}, options) => {
    la(browser.family === 'chromium', 'this test can only be run with a chromium-family browser')

    // set debugging port to go through our lil TCP proxy
    const newArgs = options.args.filter((arg) => !arg.startsWith('--remote-debugging-port='))

    newArgs.push(`--remote-debugging-port=${fakePort}`)

    la(newArgs.length === options.args.length, 'arg list length should stay the same length')

    options.args = newArgs

    return startTcpProxy()
    .then(() => {
      return options
    })
  })

  on('task', {
    'get:stats' () {
      return {
        currentConnectionCount,
        totalConnectionCount,
      }
    },
    'kill:active:connections' () {
      server.emit('kill-active-connections')

      return null
    },

  })

  return config
}
