import _ from 'lodash'
import minimatch from 'minimatch'
import * as uri from './uri'
import debugModule from 'debug'
import _parseDomain from '@cypress/parse-domain'
import type { ParsedHost, ParsedHostWithProtocolAndHost } from './types'

export type Policy = 'same-origin' | 'same-super-domain-origin' | 'schemeful-same-site'

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

export function domainPropsToHostname ({ domain, subdomain, tld }: Record<string, any>) {
  return _.compact([subdomain, domain, tld]).join('.')
}

/**
 * same-origin: Whether or not a urls scheme, port, and host match. @see https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
 * same-super-domain-origin: Whether or not a url's scheme, domain, top-level domain, and port match
 * same-site: Whether or not a url's scheme, domain, and top-level domain match. @see https://developer.mozilla.org/en-US/docs/Glossary/Site
 * @param {Policy} policy - the policy being used
 * @param {string} frameUrl - the url being compared
 * @param {ParsedHostWithProtocolAndHost} topProps - the props being compared against the url
 * @returns {boolean} whether or not the props and url fit the policy
 */
export function urlMatchesPolicyProps ({ policy, frameUrl, topProps }: {
  policy: Policy
  frameUrl: string
  topProps: ParsedHostWithProtocolAndHost
}): boolean {
  if (!policy || !frameUrl || !topProps) {
    return false
  }

  const urlProps = parseUrlIntoHostProtocolDomainTldPort(frameUrl)

  switch (policy) {
    case 'same-origin': {
      // if same origin, all parts of the props needs to match, including subdomain and scheme
      return _.isEqual(urlProps, topProps)
    }
    case 'same-super-domain-origin':
    case 'schemeful-same-site': {
      const { port: port1, subdomain: _unused1, ...parsedUrl } = urlProps
      const { port: port2, subdomain: _unused2, ...relevantProps } = topProps

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

export function urlMatchesPolicy ({ policy, frameUrl, topUrl }: {
  policy: Policy
  frameUrl: string
  topUrl: string
}): boolean {
  if (!policy || !frameUrl || !topUrl) {
    return false
  }

  return urlMatchesPolicyProps({
    policy,
    frameUrl,
    topProps: parseUrlIntoHostProtocolDomainTldPort(topUrl),
  })
}

export function urlOriginsMatch (frameUrl: string, topUrl: string): boolean {
  return urlMatchesPolicy({
    policy: 'same-origin',
    frameUrl,
    topUrl,
  })
}

export const urlSameSiteMatch = (frameUrl: string, topUrl: string): boolean => {
  return urlMatchesPolicy({
    policy: 'schemeful-same-site',
    frameUrl,
    topUrl,
  })
}

/**
 * @param url - the url to check the policy against.
 * @param arrayOfStringOrGlobPatterns - an array of url strings or globs to match against
 * @returns {boolean} - whether or not a match was found
 */
const doesUrlHostnameMatchGlobArray = (url: string, arrayOfStringOrGlobPatterns: string[]): boolean => {
  let { hostname } = uri.parse(url)

  return !!arrayOfStringOrGlobPatterns.find((globPattern) => {
    return minimatch(hostname || '', globPattern)
  })
}

/**
 * Returns the policy that will be used for the specified url.
 * @param url - the url to check the policy against.
 * @param opts - an options object containing the skipDomainInjectionForDomains config. Default is undefined.
 * @returns a Policy string.
 */
export const policyFromConfig = (config: { injectDocumentDomain: boolean }): Policy => {
  return config.injectDocumentDomain ?
    'same-super-domain-origin' :
    'same-origin'
}

export const policyFromDomainInjectionConfig = (injectDocumentDomain: boolean) => {
  return injectDocumentDomain ? 'same-super-domain-origin' : 'same-origin'
}

/**
 * @param url - The url to check for injection
 * @param opts - an options object containing the skipDomainInjectionForDomains config. Default is undefined.
 * @returns {boolean} whether or not document.domain should be injected solely based on the url.
 */
export const shouldInjectDocumentDomain = (url: string, opts?: {
  skipDomainInjectionForDomains: string[] | null
}) => {
  // When determining if we want to injection document domain,
  // We need to make sure the experimentalSkipDomainInjection feature flag is off.
  // If on, we need to make sure the glob pattern doesn't exist in the array so we cover possible intersections (google).
  if (_.isArray(opts?.skipDomainInjectionForDomains)) {
    // if we match the glob, we want to return false
    return !doesUrlHostnameMatchGlobArray(url, opts?.skipDomainInjectionForDomains as string[])
  }

  return true
}

/**
 * Checks the supplied url's against the determined policy.
 * The policy is same-super-domain-origin unless the domain is in the list of strict same origin domains,
 * in which case the policy is 'same-origin'
 * @param frameUrl - The url you are testing the policy for.
 * @param topUrl - The url you are testing the policy in context of.
 * @param opts - an options object containing the skipDomainInjectionForDomains config. Default is undefined.
 * @returns boolean, true if matching, false if not.
 */

/**
 * Checks the supplied url and props against the determined policy.
 * The policy is same-super-domain-origin unless the domain is in the list of strict same origin domains,
 * in which case the policy is 'same-origin'
 * @param frameUrl - The url you are testing the policy for.
 * @param topProps - The props of the url you are testing the policy in context of.
 * @param opts - an options object containing the skipDomainInjectionForDomains config. Default is undefined.
 * @returns boolean, true if matching, false if not.
 */
export const urlMatchesPolicyBasedOnDomainProps = (frameUrl: string, topProps: ParsedHostWithProtocolAndHost, opts?: {
  injectDocumentDomain: boolean
}): boolean => {
  const policy = opts?.injectDocumentDomain ? 'same-super-domain-origin' : 'same-origin'

  return urlMatchesPolicyProps({
    policy,
    frameUrl,
    topProps,
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
 * Returns the super-domain of a URL
 *
 * The primary driver uses the super-domain origin to allow tests to
 * navigate between subdomains of the same super-domain by setting
 * document.domain to the super-domain
 * @param url - the full absolute url
 * @returns the super domain origin
 * ex: http://www.example.com:8081/my/path -> http://example.com:8081
 */
export function getSuperDomainOrigin (url: string) {
  // @ts-ignore
  const { port, protocol } = new URL(url)

  // super domain origin is comprised of:
  // protocol + superdomain + port (subdomain is not factored in)
  return _.compact([`${protocol}//${getSuperDomain(url)}`, port]).join(':')
}
