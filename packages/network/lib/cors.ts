import _ from 'lodash'
import * as uri from './uri'
import debugModule from 'debug'
import _parseDomain, { ParsedDomain } from '@cypress/parse-domain'
import type { ParsedHost } from './types'

const debug = debugModule('cypress:network:cors')

// match IP addresses or anything following the last .
const customTldsRe = /(^[\d\.]+$|\.[^\.]+$)/

export function getSuperDomain (url) {
  const parsed = parseUrlIntoDomainTldPort(url)

  return _.compact([parsed.domain, parsed.tld]).join('.')
}

export function parseDomain (domain: string, options = {}) {
  return _parseDomain(domain, _.defaults(options, {
    privateTlds: true,
    customTlds: customTldsRe,
  }))
}

export function parseUrlIntoDomainTldPort (str) {
  let { hostname, port, protocol } = uri.parse(str)

  if (!hostname) {
    hostname = ''
  }

  if (!port) {
    port = protocol === 'https:' ? '443' : '80'
  }

  let parsed: Partial<ParsedDomain> | null = parseDomain(hostname)

  // if we couldn't get a parsed domain
  if (!parsed) {
    // then just fall back to a dumb check
    // based on assumptions that the tld
    // is the last segment after the final
    // '.' and that the domain is the segment
    // before that
    const segments = hostname.split('.')

    parsed = {
      tld: segments[segments.length - 1] || '',
      domain: segments[segments.length - 2] || '',
    }
  }

  const obj: ParsedHost = {}

  obj.port = port
  obj.tld = parsed.tld
  obj.domain = parsed.domain

  debug('Parsed URL %o', obj)

  return obj
}

export function getDomainNameFromUrl (url: string) {
  const parsedHost = parseUrlIntoDomainTldPort(url)

  return getDomainNameFromParsedHost(parsedHost)
}

export function getDomainNameFromParsedHost (parsedHost: ParsedHost) {
  return _.compact([parsedHost.domain, parsedHost.tld]).join('.')
}

export function urlMatchesOriginPolicyProps (urlStr, props) {
  // take a shortcut here in the case
  // where remoteHostAndPort is null
  if (!props) {
    return false
  }

  const parsedUrl = parseUrlIntoDomainTldPort(urlStr)

  // does the parsedUrl match the parsedHost?
  return _.isEqual(parsedUrl, props)
}

export function urlOriginsMatch (url1, url2) {
  if (!url1 || !url2) return false

  const parsedUrl1 = parseUrlIntoDomainTldPort(url1)
  const parsedUrl2 = parseUrlIntoDomainTldPort(url2)

  return _.isEqual(parsedUrl1, parsedUrl2)
}

export function urlMatchesOriginProtectionSpace (urlStr, origin) {
  const normalizedUrl = uri.addDefaultPort(urlStr).format()
  const normalizedOrigin = uri.addDefaultPort(origin).format()

  return _.startsWith(normalizedUrl, normalizedOrigin)
}

export function getOriginPolicy (url: string) {
  // @ts-ignore
  const { port, protocol } = new URL(url)

  // origin policy is comprised of:
  // protocol + superdomain + port (subdomain is not factored in)
  return _.compact([`${protocol}//${getSuperDomain(url)}`, port]).join(':')
}
