const _ = require('lodash')
const url = require('url')

const DEFAULT_PORTS = {
  https: '443',
  http: '80',
}

const stripProtocolAndDefaultPorts = function (urlToCheck) {
  // grab host which is 'hostname:port' only
  const { host, hostname, port } = url.parse(urlToCheck)

  // if we have a default port for 80 or 443
  // then just return the hostname
  if (_.values(DEFAULT_PORTS).includes(port)) {
    return hostname
  }

  // else return the host
  return host
}

const removeDefaultPort = function (urlToCheck) {
  const parsed = url.parse(urlToCheck)

  if (_.values(DEFAULT_PORTS).includes(parsed.port)) {
    parsed.host = null
    parsed.port = null
  }

  return url.format(parsed)
}

const addDefaultPort = function (urlToCheck) {
  const parsed = url.parse(urlToCheck)

  if (!parsed.port) {
    parsed.port = DEFAULT_PORTS[parsed.protocol]
  }

  return url.format(parsed)
}

const getPath = (urlToCheck) => {
  return url.parse(urlToCheck).path
}

module.exports = {
  addDefaultPort,

  getPath,

  removeDefaultPort,

  stripProtocolAndDefaultPorts,
}
