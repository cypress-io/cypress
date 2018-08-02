url = require("url")

DEFAULT_PORTS = ["443", "80"]

stripProtocolAndDefaultPorts = (urlToCheck) ->
  ## grab host which is 'hostname:port' only
  { host, hostname, port } = url.parse(urlToCheck)

  ## if we have a default port for 80 or 443
  ## then just return the hostname
  if port in DEFAULT_PORTS
    return hostname

  ## else return the host
  return host

removeDefaultPort = (urlToCheck) ->
  parsed = url.parse(urlToCheck)

  if parsed.port in DEFAULT_PORTS
    parsed.host = null
    parsed.port = null

  url.format(parsed)

getPath = (urlToCheck) ->
  url.parse(urlToCheck).path

module.exports = {
  getPath

  removeDefaultPort

  stripProtocolAndDefaultPorts
}
