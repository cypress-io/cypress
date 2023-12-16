// useful links for describing the parts that make up a URL:
// - https://nodejs.org/api/url.html#url_url_strings_and_url_objects
// - https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Examples
//
// node's url formatting algorithm (which acts pretty unexpectedly)
// - https://nodejs.org/api/url.html#url_url_format_urlobject

import _ from 'lodash'
import url from 'url'

// yup, protocol contains a: ':' colon
// at the end of it (-______________-)
const DEFAULT_PROTOCOL_PORTS = {
  'https:': '443',
  'http:': '80',
} as const

type Protocols = keyof typeof DEFAULT_PROTOCOL_PORTS

const DEFAULT_PORTS = _.values(DEFAULT_PROTOCOL_PORTS) as string[]

const portIsDefault = (port: string | null) => {
  return port && DEFAULT_PORTS.includes(port)
}

const parseClone = (urlObject: any) => {
  return url.parse(_.clone(urlObject))
}

export const parse = url.parse

export function stripProtocolAndDefaultPorts (urlToCheck: string) {
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

export function removePort (urlObject: any) {
  const parsed = parseClone(urlObject)

  // set host to undefined else url.format(...) will ignore the port property
  // https://nodejs.org/api/url.html#url_url_format_urlobject
  // Additionally, the types are incorrect (don't include undefined), so we add TS exceptions
  /* @ts-ignore */
  delete parsed.host
  /* @ts-ignore */
  delete parsed.port

  return parsed
}

export function removeDefaultPort (urlToCheck: any) {
  let parsed = parseClone(urlToCheck)

  if (portIsDefault(parsed.port)) {
    parsed = removePort(parsed)
  }

  return parsed
}

export function addDefaultPort (urlToCheck: any) {
  const parsed = parseClone(urlToCheck)

  if (!parsed.port) {
    // unset host...
    // see above for reasoning
    /* @ts-ignore */
    delete parsed.host
    if (parsed.protocol) {
      parsed.port = DEFAULT_PROTOCOL_PORTS[parsed.protocol as Protocols]
    } else {
      /* @ts-ignore */
      delete parsed.port
    }
  }

  return parsed
}

export function getPath (urlToCheck: string) {
  // since we are only concerned with the pathname and search properties,
  // we can set the base to a fake base to handle relative urls
  const url = new URL(urlToCheck, 'http://fake-base.com')

  return `${url.pathname}${url.search}`
}

const localhostIPRegex = /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/

export function isLocalhost (url: URL) {
  return (
    // https://datatracker.ietf.org/doc/html/draft-west-let-localhost-be-localhost#section-2
    url.hostname === 'localhost'
    || url.hostname.endsWith('.localhost')
    // [::1] is the IPv6 localhost address
    // See https://datatracker.ietf.org/doc/html/rfc4291#section-2.5.3
    || url.hostname === '[::1]'
    // 127.0.0.0/8 are considered localhost for IPv4
    // See https://datatracker.ietf.org/doc/html/rfc5735 (Page 3)
    || localhostIPRegex.test(url.hostname)
  )
}

export function origin (urlStr: string) {
  const parsed = url.parse(urlStr)

  parsed.hash = null
  parsed.search = null
  parsed.query = null
  parsed.path = null
  parsed.pathname = null

  return url.format(parsed)
}
