import _ from 'lodash'
import * as uri from './uri'
import debugModule from 'debug'
import _parseDomain from '@cypress/parse-domain'
import type { ParsedHost, ParsedHostWithProtocolAndHost } from './types'

type Policy = 'same-origin' | 'same-super-domain-origin' | 'schemeful-same-site'

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

/**
 * same-origin: Whether or not a a urls scheme, port, and host match. @see https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
 * same-super-domain-origin: Whether or not a url's scheme, domain, top-level domain, and port match
 * same-site: Whether or not a url's scheme, domain, and top-level domain match. @see https://developer.mozilla.org/en-US/docs/Glossary/Site
 * @param {Policy} policy - the policy being used
 * @param {string} url - the url being compared
 * @param {ParsedHostWithProtocolAndHost} props - the props being compared against the url
 * @returns {boolean} whether or not the props and url fit the policy
 */
function urlMatchesPolicyProps ({ policy, url, props }: {
  policy: Policy
  url: string
  props: ParsedHostWithProtocolAndHost
}): boolean {
  if (!policy || !url || !props) {
    return false
  }

  const urlProps = parseUrlIntoHostProtocolDomainTldPort(url)

  switch (policy) {
    case 'same-origin': {
      // if same origin, all parts of the props needs to match, including subdomain and scheme
      return _.isEqual(urlProps, props)
    }
    case 'same-super-domain-origin':
    case 'schemeful-same-site': {
      const { port: port1, subdomain: _unused1, ...parsedUrl } = urlProps
      const { port: port2, subdomain: _unused2, ...relevantProps } = props

      let doPortsPassSameSchemeCheck: boolean

      if (policy === 'same-super-domain-origin') {
        // if a super domain origin comparison, the ports MUST be strictly equal
        doPortsPassSameSchemeCheck = port1 === port2
      } else {
        // otherwise, this is a same-site comparison
        // If HTTPS, ports NEED to match. Otherwise, HTTP ports can be different and are same origin
        doPortsPassSameSchemeCheck = port1 !== port2 ? (port1 !== '443' && port2 !== '443') : true
      }

      return doPortsPassSameSchemeCheck && _.isEqual(parsedUrl, relevantProps)
    }
    default:
      return false
  }
}

function urlMatchesPolicy ({ policy, url1, url2 }: {
  policy: Policy
  url1: string
  url2: string
}): boolean {
  if (!policy || !url1 || !url2) {
    return false
  }

  return urlMatchesPolicyProps({
    policy,
    url: url1,
    props: parseUrlIntoHostProtocolDomainTldPort(url2),
  })
}

export function urlMatchesOriginProps (url, props) {
  return urlMatchesPolicyProps({
    policy: 'same-origin',
    url,
    props,
  })
}

export function urlMatchesSuperDomainOriginProps (url, props) {
  return urlMatchesPolicyProps({
    policy: 'same-super-domain-origin',
    url,
    props,
  })
}

export function urlMatchesSameSiteProps (url: string, props: ParsedHostWithProtocolAndHost) {
  return urlMatchesPolicyProps({
    policy: 'schemeful-same-site',
    url,
    props,
  })
}

export function urlOriginsMatch (url1: string, url2: string) {
  return urlMatchesPolicy({
    policy: 'same-origin',
    url1,
    url2,
  })
}

export function urlsSuperDomainOriginMatch (url1: string, url2: string) {
  return urlMatchesPolicy({
    policy: 'same-super-domain-origin',
    url1,
    url2,
  })
}

export const urlSameSiteMatch = (url1: string, url2: string) => {
  return urlMatchesPolicy({
    policy: 'schemeful-same-site',
    url1,
    url2,
  })
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
  const { origin } = new URL(url)

  // origin is comprised of:
  // protocol + subdomain + superdomain + port
  return origin
}

/**
 * We use the super domain origin in the driver to determine whether or not we need to reload/interact with the AUT, and
 * currently in the spec bridge to interact with the AUT frame, which uses document.domain set to the super domain
 * @param url - the full absolute url
 * @returns the super domain origin -
 * ex: http://www.example.com:8081/my/path -> http://example.com:8081/my/path
 */
export function getSuperDomainOrigin (url: string) {
  // @ts-ignore
  const { port, protocol } = new URL(url)

  // super domain origin is comprised of:
  // protocol + superdomain + port (subdomain is not factored in)
  return _.compact([`${protocol}//${getSuperDomain(url)}`, port]).join(':')
}
