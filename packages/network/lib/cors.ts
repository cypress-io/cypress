import _ from 'lodash'
import * as uri from './uri'
import debugModule from 'debug'
import _parseDomain from '@cypress/parse-domain'
import type { ParsedHost, ParsedHostWithProtocolAndHost } from './types'

const debug = debugModule('cypress:network:cors')

// match IP addresses or anything following the last .
const customTldsRe = /(^[\d\.]+$|\.[^\.]+$)/

export function getSuperDomain (url) {
  const parsed = parseUrlIntoHostProtocolDomainTldPort(url)

  return _.compact([parsed.domain, parsed.tld]).join('.')
}

export function parseDomain (domain: string, options = {}) {
  return _parseDomain(domain, _.defaults(options, {
    privateTlds: true,
    customTlds: customTldsRe,
  }))
}

export function parseUrlIntoHostProtocolDomainTldPort (str) {
  let { hostname, port, protocol } = uri.parse(str)

  if (!hostname) {
    hostname = ''
  }

  if (!port) {
    port = protocol === 'https:' ? '443' : '80'
  }

  let parsed: Partial<ParsedHostWithProtocolAndHost> | null = parseDomain(hostname)

  // if we couldn't get a parsed domain
  if (!parsed) {
    // then just fall back to a dumb check
    // based on assumptions that the tld
    // is the last segment after the final
    // '.' and that the domain is the segment
    // before that
    const segments = hostname.split('.')

    parsed = {
      subdomain: segments[segments.length - 3] || '',
      tld: segments[segments.length - 1] || '',
      domain: segments[segments.length - 2] || '',
    }
  }

  const obj: ParsedHostWithProtocolAndHost = {
    port,
    protocol,
    subdomain: parsed.subdomain || null,
    domain: parsed.domain,
    tld: parsed.tld,
  }

  debug('Parsed URL %o', obj)

  return obj
}

export function getDomainNameFromUrl (url: string) {
  const parsedHost = parseUrlIntoHostProtocolDomainTldPort(url)

  return getDomainNameFromParsedHost(parsedHost)
}

export function getDomainNameFromParsedHost (parsedHost: ParsedHost) {
  return _.compact([parsedHost.domain, parsedHost.tld]).join('.')
}

export function urlMatchesSuperDomainOriginProps (urlStr, props) {
  return urlMatchesSameSiteProps(urlStr, props, true)
}

export function urlMatchesOriginProps (urlStr, props) {
  if (!props) {
    return false
  }

  const parsedUrl = parseUrlIntoHostProtocolDomainTldPort(urlStr)

  // does the parsedUrl match the parsedHost?
  return _.isEqual(parsedUrl, props)
}

/**
 *
 * @param {string} urlStr - The url string
 * @param {ParsedHostWithProtocolAndHost|undefined} props - The broken down props from parseUrlIntoHostProtocolDomainTldPort
 * @param {boolean} [strictPortMatch] - Whether or not to make port comparison exactly match. If set to true, this function checks to see if superDomainOriginPolicies match
 * @returns {boolean}
 */
export function urlMatchesSameSiteProps (urlStr: string, props?: ParsedHostWithProtocolAndHost, strictPortMatch = false) {
  if (!props) {
    return false
  }

  const { port: port1, subdomain: _unused1, ...parsedUrl } = parseUrlIntoHostProtocolDomainTldPort(urlStr)
  const { port: port2, subdomain: _unused2, ...relevantProps } = props

  // If HTTPS, ports NEED to match. Otherwise, HTTP ports can be different and are same origin
  let doPortsPassSameSchemeCheck = true

  if (strictPortMatch) {
    doPortsPassSameSchemeCheck = port1 === port2
  } else {
    doPortsPassSameSchemeCheck = port1 !== port2 ? (port1 !== '443' && port2 !== '443') : true
  }

  // does the parsedUrl match the parsedHost?
  return doPortsPassSameSchemeCheck && _.isEqual(parsedUrl, relevantProps)
}

export function urlOriginsMatch (url1: string, url2: string) {
  if (!url1 || !url2) return false

  // To fully match origin policy, the full host (including subdomain) and port is required to match. @see https://developer.mozilla.org/en-US/docs/Glossary/Origin
  return urlMatchesOriginProps(url1, parseUrlIntoHostProtocolDomainTldPort(url2))
}

export function urlsSuperDomainOriginMatch (url1: string, url2: string) {
  return urlSameSiteMatch(url1, url2, true)
}

/**
 * Whether or not a url's scheme, domain, and top-level domain match to determine whether or not
 * a cookie is considered first-party. See https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#third-party_cookies
 * for more details.
 * @param {string} url1 - the first url
 * @param {string} url2 - the second url
 * @param {boolean} [strictPortMatch] - Whether or not to make port comparison exactly match. If set to true, this function checks to see if superDomainOriginPolicies match
 * @returns {boolean} whether or not the URL Scheme, Domain, and TLD match. This is called same-site and
 * is allowed to have a different port or subdomain. @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site#directives
 * for more details.
 */
export const urlSameSiteMatch = (url1: string, url2: string, strictPortMatch = false) => {
  if (!url1 || !url2) return false

  return urlMatchesSameSiteProps(url1, parseUrlIntoHostProtocolDomainTldPort(url2), strictPortMatch)
}

declare module 'url' {
  interface UrlWithStringQuery {
    format(): string
  }
}

export function urlMatchesOriginProtectionSpace (urlStr, origin) {
  const normalizedUrl = uri.addDefaultPort(urlStr).format()
  const normalizedOrigin = uri.addDefaultPort(origin).format()

  return _.startsWith(normalizedUrl, normalizedOrigin)
}

export function getOrigin (url: string) {
  // @ts-ignore
  const { port, protocol, hostname } = new URL(url)

  // origin policy is comprised of:
  // protocol + subdomain + superdomain + port
  return _.compact([`${protocol}//${hostname}`, port]).join(':')
}

/**
 * We use the super domain origin policy in the driver to determine whether or not we need to reload/interact with the AUT, and
 * currently in the spec bridge to interact with the AUT frame, which uses document.domain set to the super domain
 * @param url - the full absolute url
 * @returns the super domain origin policy -
 * ex: http://www.example.com:8081/my/path -> http://example.com:8081/my/path
 */
export function getSuperDomainOrigin (url: string) {
  // @ts-ignore
  const { port, protocol } = new URL(url)

  // super domain origin policy is comprised of:
  // protocol + superdomain + port (subdomain is not factored in)
  return _.compact([`${protocol}//${getSuperDomain(url)}`, port]).join(':')
}
