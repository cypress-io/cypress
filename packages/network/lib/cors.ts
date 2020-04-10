import _ from 'lodash'
import * as uri from './uri'
import debugModule from 'debug'
import _parseDomain, { ParsedDomain } from '@cypress/parse-domain'

const debug = debugModule('cypress:network:cors')

// match IP addresses or anything following the last .
const customTldsRe = /(^[\d\.]+$|\.[^\.]+$)/

type ParsedHost = {
  port?: string
  tld?: string
  domain?: string
}

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

export function urlMatchesOriginProtectionSpace (urlStr, origin) {
  const normalizedUrl = uri.addDefaultPort(urlStr).format()
  const normalizedOrigin = uri.addDefaultPort(origin).format()

  return _.startsWith(normalizedUrl, normalizedOrigin)
}
