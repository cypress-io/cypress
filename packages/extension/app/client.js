const { client } = require('@packages/socket/dist/lib/browser')

const connect = (host, path, extraOpts = {}) => {
  return client.connect(host, {
    path,
    transports: ['websocket'],
    ...extraOpts,
  })
}

module.exports = {
  connect,

  socketIoClient: client,
}
