import { parse as tldtsParse } from 'tldts'

export type ParsedDomainParts = {
  subdomain: string
  domain: string
  tld: string
}

export type ParseDomainOptions = {
  privateTlds?: boolean
  /** Ignored for compatibility with the old parse-domain API; unknown suffixes use tldts plus the legacy default `customTlds` rule from the former cors wrapper. */
  customTlds?: RegExp | string[]
}

const TLDT_OPTS_BASE = {
  extractHostname: false,
  mixedInputs: false,
} as const

/**
 * Former default in the @cypress/parse-domain wrapper (`cors.ts`): any hostname whose
 * last dot-suffix is non-empty, or digit/dot-only (IPv4-ish), was still split so
 * callers such as `isHostOnlyCookie` did not see `parseDomain` return null when tldts
 * has no PSL row (empty `publicSuffix`).
 */
const LEGACY_CUSTOM_TLDS_RE = /(^[\d.]+$|\.[^.]+$)/

function legacyCustomTldSplit (hostname: string): ParsedDomainParts | null {
  if (!LEGACY_CUSTOM_TLDS_RE.test(hostname)) {
    return null
  }

  if (/^[\d.]+$/.test(hostname)) {
    return {
      subdomain: '',
      domain: '',
      tld: hostname,
    }
  }

  const segments = hostname.split('.')

  if (segments.length < 2) {
    return null
  }

  const tld = segments[segments.length - 1] || ''
  const domain = segments[segments.length - 2] || ''
  const subdomain = segments.length > 2 ? segments.slice(0, -2).join('.') : ''

  return { subdomain, domain, tld }
}

function tldtsToLegacy (hostname: string, r: ReturnType<typeof tldtsParse>): ParsedDomainParts | null {
  if (r.isIp && r.hostname) {
    return {
      subdomain: '',
      domain: '',
      tld: r.hostname,
    }
  }

  // bare localhost is a special case — return null from parseDomain so the existing
  // fallback in parseUrlIntoHostProtocolDomainTldPort still defines behavior
  if (hostname === 'localhost' && r.domain == null && r.publicSuffix === 'localhost') {
    return null
  }

  if (r.publicSuffix == null || r.publicSuffix === '') {
    return null
  }

  const tld = r.publicSuffix
  const domain = r.domainWithoutSuffix ?? ''
  const subdomain = r.subdomain ?? ''

  return { subdomain, domain, tld }
}

/**
 * Public-suffix-aware hostname split compatible with the former @cypress/parse-domain
 * defaults (private suffixes, IPv4/IPv6). When tldts yields no suffix, applies the same
 * legacy `customTlds` regexp the old cors wrapper always passed so host-only cookie logic
 * still sees a parsed shape where applicable.
 */
export function parseDomain (input: string, options: ParseDomainOptions = {}): ParsedDomainParts | null {
  const merged: ParseDomainOptions & { privateTlds: boolean } = {
    privateTlds: true,
    ...options,
  }

  const hostname = input.replace(/^\.+/, '').trim()

  if (!hostname) {
    return null
  }

  const r = tldtsParse(hostname, {
    ...TLDT_OPTS_BASE,
    allowPrivateDomains: merged.privateTlds !== false,
  })

  const fromTld = tldtsToLegacy(hostname, r)

  if (fromTld !== null) {
    return fromTld
  }

  return legacyCustomTldSplit(hostname)
}
