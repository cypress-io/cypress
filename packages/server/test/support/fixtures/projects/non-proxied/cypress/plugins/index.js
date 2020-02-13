const { expect } = require('chai')
const HttpsProxyAgent = require('https-proxy-agent')
const os = require('os')
const socketIo = require('@packages/socket')

module.exports = (on) => {
  on('task', {
    'get:tmp:path': () => {
      return os.tmpdir()
    },
    'assert:ws:fails': ({ proxyUrl, socketIoRoute }) => {
      const wsClient = socketIo.client(proxyUrl, {
        path: socketIoRoute,
        transports: ['websocket'],
        parser: socketIo.circularParser,
      })

      return new Promise((resolve, reject) => {
        wsClient.on('connect_error', resolve)
        wsClient.on('connect', reject)
      }).then((connectErr) => {
        expect(connectErr.description.message).to.eq('Unexpected server response: 400')

        return null
      })
    },
    'assert:proxied:ws:works': ({ proxyUrl, socketIoRoute }) => {
      const agent = new HttpsProxyAgent(proxyUrl)

      const wsClient = socketIo.client(proxyUrl, {
        agent,
        path: socketIoRoute,
        transports: ['websocket'],
        parser: socketIo.circularParser,
      })

      return new Promise((resolve, reject) => {
        wsClient.on('connect_error', reject)
        wsClient.on('connect', resolve)
      }).then(() => {
        return null
      })
    },
  })
}
