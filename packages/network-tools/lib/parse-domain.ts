import { parse as tldtsParse } from 'tldts'

/**
 * Shape historically returned by @cypress/parse-domain (peerigon parse-domain v2).
 * Empty `subdomain` is normalized to '' here; callers may coerce to null.
 */
export type ParsedDomainParts = {
  subdomain: string
  domain: string
  tld: string
}

export type ParseDomainOptions = {
  privateTlds?: boolean
  /** Ignored for compatibility with the old parse-domain API; tldts uses PSL + built-in rules. */
  customTlds?: RegExp | string[]
}

const TLDT_OPTS_BASE = {
  extractHostname: false,
  mixedInputs: false,
} as const

function tldtsToLegacy (hostname: string, r: ReturnType<typeof tldtsParse>): ParsedDomainParts | null {
  if (r.isIp && r.hostname) {
    return {
      subdomain: '',
      domain: '',
      tld: r.hostname,
    }
  }

  // Bare "localhost": tldts leaves domain null; legacy package also failed here and
  // parseUrlIntoHostProtocolDomainTldPort relied on the segment fallback.
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
 * defaults (private suffixes, IPs). Does not support arbitrary RegExp customTlds beyond
 * what tldts + PSL already classifies.
 */
export function parseDomain (input: string, options: ParseDomainOptions = {}): ParsedDomainParts | null {
  const merged: ParseDomainOptions & { privateTlds: boolean } = {
    privateTlds: true,
    ...options,
  }

  const hostname = input.replace(/^\./, '').trim()

  if (!hostname) {
    return null
  }

  const r = tldtsParse(hostname, {
    ...TLDT_OPTS_BASE,
    allowPrivateDomains: merged.privateTlds !== false,
  })

  return tldtsToLegacy(hostname, r)
}
