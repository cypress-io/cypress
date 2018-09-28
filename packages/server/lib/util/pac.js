const express = require('express')
const getPort = require('get-port')

const generate = (proxyPort, bypassPort) => {
  return `
    function FindProxyForURL (url, host) {
      var bypassPort = ${bypassPort};

      if (bypassPort && url.indexOf(':' + ${bypassPort}) > -1) {
        return 'DIRECT';
      }

      return 'PROXY http://127.0.0.1:${proxyPort}';
    }
  `
}

const startServer = (proxyPort, bypassPort) => {
  const pacString = generate(proxyPort, bypassPort)
  const app = express()
  app.get('*', (req, res) => {
    return res.send(pacString)
  })

  return getPort()
  .then((port) => {
    console.log('listening on', port)
    return app.listen(port)
  })
}

module.exports = {
  generate,
  startServer,
}
