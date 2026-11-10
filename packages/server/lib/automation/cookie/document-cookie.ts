import Debug from 'debug'
import { CookieJar as ToughCookieJar } from 'tough-cookie'
import type { Cookie } from 'tough-cookie'
import { isLocalhost } from '@packages/network-tools'
import { cookieJar, toughCookieToAutomationCookie } from './jar'
import type { SerializableAutomationCookie } from './jar'
import { isBlockedByExisting, meetsDocumentCookieRules, parseDocumentCookie } from './document-cookie-rules'
import type { ExistingCookie } from './document-cookie-rules'

const debug = Debug('cypress:server:automation:cookie:document-cookie')

interface DocumentCookieWrite {
  cookieString?: unknown
  url?: unknown
}

export interface DocumentCookieAutomation {
  getCookies: (filter: { name: string }) => Promise<ExistingCookie[]>
  setCookie: (cookie: SerializableAutomationCookie) => Promise<unknown>
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

const resolveDomain = (cookie: Cookie, url: URL): Cookie | undefined => {
  try {
    // the shared jar does not reject public suffixes, so a throwaway one resolves
    // the domain and applies tough-cookie's domain and HttpOnly rules
    return new ToughCookieJar(undefined, { rejectPublicSuffixes: true }).setCookieSync(cookie, url.href, { http: false })
  } catch (err) {
    debug('ignoring document.cookie write %s: %s', cookie, err.message)

    return
  }
}

/**
 * Applies a `document.cookie` write from a cross-origin AUT page to the server-side
 * jar and the browser, keeping only cookies that page could have set itself.
 */
export const setDocumentCookie = async ({ cookieString, url }: DocumentCookieWrite, automation: DocumentCookieAutomation) => {
  const pageUrl = parseUrl(url)

  if (typeof cookieString !== 'string' || !pageUrl) return

  const parsed = parseDocumentCookie(cookieString, pageUrl.pathname)
  const isSecure = isSecureUrl(pageUrl)

  if (!parsed || !meetsDocumentCookieRules(parsed, isSecure)) return

  const cookie = resolveDomain(parsed, pageUrl)

  if (!cookie?.domain || !cookie.path) return

  const stored = { name: cookie.key, domain: cookie.domain, path: cookie.path }

  try {
    const existing = await automation.getCookies({ name: cookie.key })

    if (existing.some((c) => isBlockedByExisting(c, stored, isSecure))) return

    cookieJar.setCookie(cookie, pageUrl.href, 'strict', { http: false })
  } catch (err) {
    // a failed lookup leaves no way to tell whether the write is allowed
    debug('ignoring document.cookie write %s: %s', cookieString, err.message)

    return
  }

  await automation.setCookie(toughCookieToAutomationCookie(cookie, pageUrl.hostname))
}
