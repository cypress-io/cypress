import { Cookie, canonicalDomain, defaultPath, domainMatch, getPublicSuffix, pathMatch } from 'tough-cookie'

// Shared with the cross-origin AUT injection, so both apply the rules a browser
// applies to a document.cookie write that tough-cookie does not.

const MAX_NAME_VALUE_BYTES = 4096
const MAX_ATTRIBUTE_BYTES = 1024

let encoder: TextEncoder | undefined

const byteLength = (value: string) => (encoder ??= new TextEncoder()).encode(value).length

// every control character but a tab
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER = /[\x00-\x08\x0a-\x1f\x7f]/

const hasControlCharacter = (value: string) => CONTROL_CHARACTER.test(value)

const isIpAddress = (domain: string) => domain.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)

const hasRegistrableDomain = (domain: string) => {
  if (!domain.includes('.') || isIpAddress(domain)) return false

  try {
    return getPublicSuffix(domain) !== null
  } catch {
    // tough-cookie throws for special-use TLDs such as .test and .localhost, which are not public suffixes
    return true
  }
}

const isOversizedAttribute = (attribute: string) => byteLength(attribute.slice(attribute.indexOf('=') + 1).trim()) > MAX_ATTRIBUTE_BYTES

export interface ExistingCookie {
  name: string
  domain: string
  path?: string | null
  httpOnly?: boolean
  secure?: boolean
  // seconds since the epoch
  expiry?: number | string | null
}

interface StoredCookie {
  name: string
  domain: string
  path: string
}

/**
 * Parses a `document.cookie` write made by a page at `pathname`. Returns
 * undefined for a string a browser would ignore.
 */
export const parseDocumentCookie = (cookieString: string, pathname: string): Cookie | undefined => {
  // browsers ignore the whole write, where tough-cookie cuts it at a line break
  if (hasControlCharacter(cookieString)) return

  const [pair, ...attributes] = cookieString.split(';')
  // browsers ignore an oversized attribute and keep the rest of the cookie
  const cookie = Cookie.parse([pair, ...attributes.filter((attribute) => !isOversizedAttribute(attribute))].join(';'), { loose: true })

  if (!cookie) return

  // tough-cookie's loose mode reads '=a=b' as a=b, but a leading '=' means there is no name
  if (pair.trim().startsWith('=')) {
    cookie.key = ''
    cookie.value = pair.trim().slice(1).trim()
  }

  if (!cookie.key && !cookie.value) return

  if (byteLength(cookie.key) + byteLength(cookie.value) > MAX_NAME_VALUE_BYTES) return

  // matches CookieJar.parse
  if (cookie.sameSite === undefined) {
    cookie.sameSite = 'lax'
  }

  if (cookie.domain) {
    cookie.domain = canonicalDomain(cookie.domain)
  }

  if (!cookie.path) {
    cookie.path = defaultPath(pathname)
    cookie.pathIsDefault = true
  }

  return cookie
}

/**
 * Whether a page may set the parsed cookie through `document.cookie`. The
 * cookie's `domain` must still be what the write's Domain attribute gave it.
 */
export const meetsDocumentCookieRules = (cookie: Pick<Cookie, 'key' | 'value' | 'secure' | 'sameSite' | 'domain' | 'path' | 'pathIsDefault'>, isSecure: boolean, hostname: string) => {
  // a Domain with no registrable part, such as an IP address, a single label or a
  // public suffix, is only allowed when it is the page's own host
  if (cookie.domain && cookie.domain !== canonicalDomain(hostname) && !hasRegistrableDomain(cookie.domain)) return false

  // a nameless cookie's value can't pass for a prefixed name
  if (!cookie.key && /^__(secure|host|http)-/i.test(cookie.value)) return false

  const name = cookie.key

  // these prefixes are reserved for cookies set by a response
  if (/^__(host-)?http-/i.test(name)) return false

  if (!cookie.secure) {
    return cookie.sameSite !== 'none' && !/^__(secure|host)-/i.test(name)
  }

  return isSecure && (!/^__host-/i.test(name) || (!cookie.domain && cookie.path === '/' && !cookie.pathIsDefault))
}

// document.cookie can't replace an HttpOnly cookie, and an insecure page can't shadow a Secure one
// TTL() does not count the time since a Max-Age cookie was created
export const isExpired = (cookie: Pick<Cookie, 'expiryTime'>) => cookie.expiryTime() <= Date.now()

// browsers report an IPv6 host in brackets and a domain cookie with a leading dot
export const isSameCookie = (existing: ExistingCookie, cookie: StoredCookie) => {
  return existing.name === cookie.name && canonicalDomain(existing.domain) === canonicalDomain(cookie.domain) && (existing.path || '/') === cookie.path
}

export const isBlockedByExisting = (existing: ExistingCookie, cookie: StoredCookie, isSecure: boolean) => {
  if (existing.name !== cookie.name) return false

  if (existing.httpOnly && isSameCookie(existing, cookie)) return true

  const existingDomain = canonicalDomain(existing.domain)
  const cookieDomain = canonicalDomain(cookie.domain)

  return !isSecure && !!existing.secure
    && (!!domainMatch(existingDomain, cookieDomain) || !!domainMatch(cookieDomain, existingDomain))
    && pathMatch(cookie.path, existing.path || '/')
}
