// useful links for describing the parts that make up a URL:
// - https://nodejs.org/api/url.html#url_url_strings_and_url_objects
// - https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Examples
//
// node's url formatting algorithm (which acts pretty unexpectedly)
// - https://nodejs.org/api/url.html#url_url_format_urlobject

const _ = require('lodash')
const url = require('url')

// yup, protocol contains a: ':' colon
// at the end of it (-______________-)
const DEFAULT_PROTOCOL_PORTS = {
  'https:': '443',
  'http:': '80',
}

const DEFAULT_PORTS = _.values(DEFAULT_PROTOCOL_PORTS)

const portIsDefault = (port) => {
  return port && DEFAULT_PORTS.includes(port)
}

const parseClone = (urlObject) => {
  return url.parse(_.clone(urlObject))
}

const parse = url.parse

const stripProtocolAndDefaultPorts = function (urlToCheck) {
  // grab host which is 'hostname:port' only
  const { host, hostname, port } = url.parse(urlToCheck)

  // if we have a default port for 80 or 443
  // then just return the hostname
  if (portIsDefault(port)) {
    return hostname
  }

  // else return the host
  return host
}

const removePort = (urlObject) => {
  const parsed = parseClone(urlObject)

  // set host to null else
  // url.format(...) will ignore
  // the port property
  // https://nodejs.org/api/url.html#url_url_format_urlobject
  parsed.host = null
  parsed.port = null

  return parsed
}

const removeDefaultPort = function (urlToCheck) {
  let parsed = parseClone(urlToCheck)

  if (portIsDefault(parsed.port)) {
    parsed = removePort(parsed)
  }

  return parsed
}

const addDefaultPort = function (urlToCheck) {
  const parsed = parseClone(urlToCheck)

  if (!parsed.port) {
    // unset host...
    // see above for reasoning
    parsed.host = null
    parsed.port = DEFAULT_PROTOCOL_PORTS[parsed.protocol]
  }

  return parsed
}

const getPath = (urlToCheck) => {
  return url.parse(urlToCheck).path
}

module.exports = {
  parse,

  getPath,

  removePort,

  addDefaultPort,

  removeDefaultPort,

  stripProtocolAndDefaultPorts,
}
