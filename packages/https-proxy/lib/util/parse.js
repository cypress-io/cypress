const url = require('url')

module.exports = {
  parseHost (hostString, defaultPort) {
    let m

    m = hostString.match(/^http:\/\/(.*)/)

    if (m) {
      const parsedUrl = url.parse(hostString)

      return {
        host: parsedUrl.hostname,
        port: parsedUrl.port,
      }
    }

    const hostPort = hostString.split(':')
    const host = hostPort[0]
    const port = hostPort.length === 2 ? +hostPort[1] : defaultPort

    return {
      host,
      port,
    }
  },

  hostAndPort (reqUrl, headers, defaultPort) {
    let m
    const {
      host,
    } = headers

    const hostPort = this.parseHost(host, defaultPort)

    // this handles paths which include the full url. This could happen if it's a proxy
    m = reqUrl.match(/^http:\/\/([^\/]*)\/?(.*)$/)

    if (m) {
      const parsedUrl = url.parse(reqUrl)

      hostPort.host = parsedUrl.hostname
      hostPort.port = parsedUrl.port
      reqUrl = parsedUrl.path
    }

    return hostPort
  },
}
