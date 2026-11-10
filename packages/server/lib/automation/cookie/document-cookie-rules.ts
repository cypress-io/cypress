import { Cookie, defaultPath, domainMatch, pathMatch } from 'tough-cookie'

// Shared with the cross-origin AUT injection, so both apply the rules a browser
// applies to a document.cookie write that tough-cookie does not.

const MAX_NAME_VALUE_BYTES = 4096
const MAX_ATTRIBUTE_BYTES = 1024

const byteLength = (value: string) => new TextEncoder().encode(value).length

const isOversizedAttribute = (attribute: string) => byteLength(attribute.slice(attribute.indexOf('=') + 1).trim()) > MAX_ATTRIBUTE_BYTES

export interface ExistingCookie {
  name: string
  domain: string
  path?: string | null
  httpOnly?: boolean
  secure?: boolean
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

  cookie.path = cookie.path || defaultPath(pathname)

  return cookie
}

/**
 * Whether a page may set the parsed cookie through `document.cookie`. The
 * cookie's `domain` must still be what the write's Domain attribute gave it.
 */
export const meetsDocumentCookieRules = (cookie: Pick<Cookie, 'key' | 'value' | 'secure' | 'sameSite' | 'domain' | 'path'>, isSecure: boolean) => {
  // a nameless cookie's value can't pass for a prefixed name
  if (!cookie.key && /^__(secure|host|http)-/i.test(cookie.value)) return false

  const name = cookie.key

  // these prefixes are reserved for cookies set by a response
  if (/^__(host-)?http-/i.test(name)) return false

  if (!cookie.secure) {
    return cookie.sameSite !== 'none' && !/^__(secure|host)-/i.test(name)
  }

  return isSecure && (!/^__host-/i.test(name) || (!cookie.domain && cookie.path === '/'))
}

// document.cookie can't replace an HttpOnly cookie, and an insecure page can't shadow a Secure one
export const isBlockedByExisting = (existing: ExistingCookie, cookie: StoredCookie, isSecure: boolean) => {
  if (existing.name !== cookie.name) return false

  const existingDomain = existing.domain.replace(/^\./, '')
  const existingPath = existing.path || '/'

  if (existing.httpOnly && existingDomain === cookie.domain && existingPath === cookie.path) return true

  return !isSecure && !!existing.secure
    && (!!domainMatch(existingDomain, cookie.domain) || !!domainMatch(cookie.domain, existingDomain))
    && pathMatch(cookie.path, existingPath)
}
