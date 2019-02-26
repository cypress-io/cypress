// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const url = require('url')

const DEFAULT_PORTS = ['443', '80']

const stripProtocolAndDefaultPorts = function (urlToCheck) {
  //# grab host which is 'hostname:port' only
  const { host, hostname, port } = url.parse(urlToCheck)

  //# if we have a default port for 80 or 443
  //# then just return the hostname
  if (DEFAULT_PORTS.includes(port)) {
    return hostname
  }

  //# else return the host
  return host
}

const removeDefaultPort = function (urlToCheck) {
  const parsed = url.parse(urlToCheck)

  if (DEFAULT_PORTS.includes(parsed.port)) {
    parsed.host = null
    parsed.port = null
  }

  return url.format(parsed)
}

const getPath = (urlToCheck) => {
  return url.parse(urlToCheck).path
}

module.exports = {
  getPath,

  removeDefaultPort,

  stripProtocolAndDefaultPorts,
}
