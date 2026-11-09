import Debug from 'debug'
import { CookieJar as ToughCookieJar } from 'tough-cookie'
import type { Cookie } from 'tough-cookie'
import { CookieJar, cookieJar, toughCookieToAutomationCookie } from './jar'
import type { SerializableAutomationCookie } from './jar'
import { isBlockedBy, isSecureUrl, meetsSecureRules } from './document-cookie-rules'
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
