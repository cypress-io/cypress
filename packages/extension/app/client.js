const { client, circularParser } = require('@packages/socket/lib/browser')

const connect = (host, path) => {
  // bail early and don't connect if we're
  // not in extension mode in the browser
  // @ts-ignore
  if (!global.chrome) {
    return
  }

  return client.connect(host, {
    path,
    transports: ['websocket'],
    // @ts-ignore
    parser: circularParser,
  })
}

module.exports = {
  connect,

  socketIoClient: client,

  socketIoParser: circularParser,
}
