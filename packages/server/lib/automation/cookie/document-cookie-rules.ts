// Shared by the server and the cross-origin AUT injection, so it must stay browser-safe.
import { domainMatch, pathMatch } from 'tough-cookie'
import type { Cookie } from 'tough-cookie'
import { isLocalhost } from '@packages/network-tools/lib/uri'

export interface ExistingCookie {
  name: string
  domain: string
  path?: string | null
  httpOnly: boolean
  secure: boolean
}

export interface StoredCookie {
  name: string
  domain: string
  path: string
}

// browsers treat localhost as a secure context, so it may set Secure cookies over http
export const isSecureUrl = (url: URL) => url.protocol === 'https:' || isLocalhost(url)

// tough-cookie does not tie Secure to the page's scheme, does not require Secure
// for SameSite=None, and matches cookie prefixes case-sensitively
export const meetsSecureRules = (cookie: Pick<Cookie, 'key' | 'secure' | 'sameSite' | 'hostOnly' | 'path'>, isSecure: boolean) => {
  if (!cookie.secure) {
    return cookie.sameSite !== 'none' && !/^__(secure|host)-/i.test(cookie.key)
  }

  return isSecure && (!/^__host-/i.test(cookie.key) || (cookie.hostOnly === true && cookie.path === '/'))
}

// document.cookie can't replace an HttpOnly cookie, and an insecure page can't shadow a Secure one
export const isBlockedBy = (existing: ExistingCookie, cookie: StoredCookie, isSecure: boolean) => {
  if (existing.name !== cookie.name) return false

  const existingDomain = existing.domain.replace(/^\./, '')
  const existingPath = existing.path || '/'

  if (existing.httpOnly && existingDomain === cookie.domain && existingPath === cookie.path) return true

  return !isSecure && existing.secure
    && (domainMatch(existingDomain, cookie.domain) || domainMatch(cookie.domain, existingDomain))
    && pathMatch(cookie.path, existingPath)
}
