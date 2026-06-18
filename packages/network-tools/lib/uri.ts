// useful links for describing the parts that make up a URL:
// - https://nodejs.org/api/url.html#url_strings_and_url_objects
// - https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Examples
//
// This module uses the WHATWG URL API (the global `URL` class) so that parsing
// and percent-encoding match what browsers (and CDP) produce.
// - https://nodejs.org/api/url.html#the-whatwg-url-api

// yup, protocol contains a: ':' colon
// at the end of it (-______________-)
const DEFAULT_PROTOCOL_PORTS = {
  'https:': '443',
  'http:': '80',
} as const

type Protocols = keyof typeof DEFAULT_PROTOCOL_PORTS

const DEFAULT_PORTS: string[] = Object.values(DEFAULT_PROTOCOL_PORTS)

const schemeRe = /^[a-z][a-z0-9+.-]*:\/\//i

// WHATWG `new URL()` throws on some inputs the legacy `url` parser tolerated
// (relative urls, out-of-range ports, etc.). When that happens we recover a
// best-effort authority (host[:port], without scheme/path/query/hash) so the
// helpers below can degrade the way the legacy parser did rather than echoing
// the raw input — which would otherwise leak the scheme/path into block-host
// matching or collapse distinct hosts together in same-origin checks.
export const getAuthority = (urlStr: string) => {
  return urlStr.replace(schemeRe, '').replace(/[/?#].*$/, '')
}

export function stripProtocolAndDefaultPorts (urlToCheck: string) {
  try {
    const { hostname, port } = new URL(urlToCheck)

    // strip a default port (80 or 443) regardless of the protocol. Note this is
    // intentionally protocol-agnostic (e.g. http://host:443 -> host) to preserve
    // the existing block-host matching behavior.
    if (!port || DEFAULT_PORTS.includes(port)) {
      return hostname
    }

    return `${hostname}:${port}`
  } catch (err) {
    // the WHATWG URL parser throws a TypeError on relative urls or out-of-range
    // ports that the legacy parser tolerated; fall back to a bare host[:port]
    // fragment (no scheme) so block-host matching still behaves as it did, but
    // let anything unexpected propagate. Use `instanceof TypeError` (not
    // `err.code`) since this package is isomorphic and the browser's URL throws
    // a TypeError with no `.code`.
    if (!(err instanceof TypeError)) {
      throw err
    }

    return getAuthority(urlToCheck)
  }
}

export function removeDefaultPort (urlToCheck: string) {
  try {
    // the WHATWG URL API automatically strips the default port (80/443)
    return new URL(urlToCheck).href
  } catch (err) {
    // a relative url has no host/port, so there is nothing to strip; degrade to
    // the original string for those (a TypeError) but let anything else throw
    if (!(err instanceof TypeError)) {
      throw err
    }

    return urlToCheck
  }
}

export function addDefaultPort (urlToCheck: string) {
  try {
    const parsed = new URL(urlToCheck)

    // the WHATWG URL API omits default ports and will not let us set them via
    // `.port`, so we build the href manually to include the explicit port
    const port = parsed.port || DEFAULT_PROTOCOL_PORTS[parsed.protocol as Protocols]
    const host = port ? `${parsed.hostname}:${port}` : parsed.hostname

    return `${parsed.protocol}//${host}${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch (err) {
    // a relative url has no host/port, so there is nothing to add; degrade to
    // the original string for those (a TypeError) but let anything else throw
    if (!(err instanceof TypeError)) {
      throw err
    }

    return urlToCheck
  }
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
  try {
    // URL.origin is the scheme + host (and non-default port) with no path,
    // search, or hash — exactly the "origin" portion of the url
    return new URL(urlStr).origin
  } catch (err) {
    // the WHATWG URL parser throws a TypeError on invalid urls (e.g. out-of-range
    // ports) that the legacy parser tolerated; fall back to scheme + authority
    // (no path/query/hash, mirroring the successful URL.origin path) for those,
    // but let anything unexpected propagate
    if (!(err instanceof TypeError)) {
      throw err
    }

    const scheme = urlStr.match(schemeRe)

    return `${scheme ? scheme[0] : ''}${getAuthority(urlStr)}`
  }
}
