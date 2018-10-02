const baseServer = require('./util/base_server')

const generate = (proxyPort, bypassPort) => {
  return `
    function FindProxyForURL (url, host) {
      var bypassPort = ${bypassPort};

      if (bypassPort && url.indexOf(':' + ${bypassPort}) > -1) {
        return 'DIRECT';
      }

      return 'PROXY 127.0.0.1:${proxyPort}';
    }
  `
}

const create = (proxyPort, bypassPort) => {
  const pacString = generate(proxyPort, bypassPort)

  return baseServer.listen((req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/x-ns-proxy-autoconfig')
    res.end(pacString)
  })
}

module.exports = {
  create,

  generate,
}
