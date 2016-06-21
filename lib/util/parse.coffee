url = require("url")

module.exports = {
  parseHost: (hostString, defaultPort) ->
    if m = hostString.match(/^http:\/\/(.*)/)
      parsedUrl = url.parse(hostString)

      return {
        host: parsedUrl.hostname
        port: parsedUrl.port
      }

    hostPort = hostString.split(':')
    host     = hostPort[0]
    port     = if hostPort.length is 2 then +hostPort[1] else defaultPort

    return {
      host: host
      port: port
    }

  hostAndPort: (reqUrl, headers, defaultPort) ->
    host = headers.host

    hostPort = @parseHost(host, defaultPort)

    ## this handles paths which include the full url. This could happen if it's a proxy
    if m = reqUrl.match(/^http:\/\/([^\/]*)\/?(.*)$/)
      parsedUrl = url.parse(reqUrl)
      hostPort.host = parsedUrl.hostname
      hostPort.port = parsedUrl.port
      reqUrl = parsedUrl.path

    hostPort
}