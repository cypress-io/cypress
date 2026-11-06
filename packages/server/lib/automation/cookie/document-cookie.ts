import Debug from 'debug'
import { CookieJar as ToughCookieJar, domainMatch, pathMatch } from 'tough-cookie'
import type { Cookie } from 'tough-cookie'
import { isLocalhost } from '@packages/network-tools'
import { CookieJar, cookieJar, toughCookieToAutomationCookie } from './jar'
import type { SerializableAutomationCookie } from './jar'

const debug = Debug('cypress:server:automation:cookie:document-cookie')

interface DocumentCookieWrite {
  cookieString?: unknown
  url?: unknown
}

type ExistingCookie = Pick<SerializableAutomationCookie, 'name' | 'domain' | 'path' | 'httpOnly' | 'secure'>

export interface DocumentCookieAutomation {
  getCookies: (filter: { name: string }) => Promise<ExistingCookie[]>
  setCookie: (cookie: SerializableAutomationCookie) => Promise<unknown>
}

interface StoredCookie {
  name: string
  domain: string
  path: string
}

const parseUrl = (url: unknown) => {
  try {
    const parsed = new URL(String(url))

    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : undefined
  } catch {
    return undefined
  }
}

// browsers treat localhost as a secure context, so it may set Secure cookies over http
const isSecureUrl = (url: URL) => url.protocol === 'https:' || isLocalhost(url)

const parseDocumentCookie = (cookieString: string, url: URL): Cookie | undefined => {
  const cookie = CookieJar.parse(cookieString)

  if (!cookie) return

  // cookies written without a Path are stored at '/'
  cookie.path = cookie.path || '/'

  try {
    // the shared jar does not reject public suffixes, so a throwaway one resolves
    // the domain and applies tough-cookie's domain and HttpOnly rules
    return new ToughCookieJar(undefined, { rejectPublicSuffixes: true }).setCookieSync(cookie, url.href, { http: false })
  } catch (err) {
    debug('ignoring document.cookie write %s: %s', cookieString, err.message)

    return
  }
}

// tough-cookie does not tie Secure to the page's scheme, does not require Secure
// for SameSite=None, and matches cookie prefixes case-sensitively
const meetsSecureRules = (cookie: Cookie, isSecure: boolean) => {
  if (!cookie.secure) {
    return cookie.sameSite !== 'none' && !/^__(secure|host)-/i.test(cookie.key)
  }

  return isSecure && (!/^__host-/i.test(cookie.key) || (cookie.hostOnly === true && cookie.path === '/'))
}

// document.cookie can't replace an HttpOnly cookie, and an insecure page can't shadow a Secure one
const isBlockedBy = (existing: ExistingCookie, cookie: StoredCookie, isSecure: boolean) => {
  if (existing.name !== cookie.name) return false

  const existingDomain = existing.domain.replace(/^\./, '')
  const existingPath = existing.path || '/'

  if (existing.httpOnly && existingDomain === cookie.domain && existingPath === cookie.path) return true

  return !isSecure && existing.secure
    && (domainMatch(existingDomain, cookie.domain) || domainMatch(cookie.domain, existingDomain))
    && pathMatch(cookie.path, existingPath)
}

/**
 * Applies a `document.cookie` write from a cross-origin AUT page to the server-side
 * jar and the browser, keeping only cookies that page could have set itself.
 */
export const setDocumentCookie = async ({ cookieString, url }: DocumentCookieWrite, automation: DocumentCookieAutomation) => {
  const pageUrl = parseUrl(url)

  if (typeof cookieString !== 'string' || !pageUrl) return

  const cookie = parseDocumentCookie(cookieString, pageUrl)
  const isSecure = isSecureUrl(pageUrl)

  if (!cookie?.domain || !cookie.path || !meetsSecureRules(cookie, isSecure)) return

  const stored = { name: cookie.key, domain: cookie.domain, path: cookie.path }
  const existing = await automation.getCookies({ name: cookie.key }).catch(() => [])

  if (existing.some((c) => isBlockedBy(c, stored, isSecure))) return

  try {
    cookieJar.setCookie(cookie, pageUrl.href, 'strict', { http: false })
  } catch (err) {
    debug('server-side jar rejected document.cookie write %s: %s', cookieString, err.message)

    return
  }

  await automation.setCookie(toughCookieToAutomationCookie(cookie, pageUrl.hostname))
}
