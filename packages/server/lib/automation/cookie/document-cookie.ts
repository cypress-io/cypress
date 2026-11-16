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
    // a throwaway jar resolves the domain and applies tough-cookie's domain and
    // HttpOnly rules without storing anything
    return new ToughCookieJar(undefined, { rejectPublicSuffixes: false }).setCookieSync(cookie, url.href, { http: false })
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

  if (!parsed || !meetsDocumentCookieRules(parsed, isSecure, pageUrl.hostname)) return

  const cookie = resolveDomain(parsed, pageUrl)

  if (!cookie?.domain || !cookie.path) return

  const stored = { name: cookie.key, domain: cookie.domain, path: cookie.path }

  const findStored = () => cookieJar.getAllCookies().find((c) => c.key === stored.name && c.domain === stored.domain && c.path === stored.path)
  const replaced = findStored()
  let written: Cookie | undefined

  try {
    // set before the browser answers, so a request the page makes right after the write carries the cookie
    cookieJar.setCookie(cookie, pageUrl.href, 'strict', { http: false })
    written = findStored()
  } catch (err) {
    debug('ignoring document.cookie write %s: %s', cookieString, err.message)

    return
  }

  const undo = () => {
    // a later write to the same cookie owns the entry now
    if (findStored() !== written) return

    cookieJar.removeCookie(stored)

    if (replaced) cookieJar.setCookie(replaced, pageUrl.href, 'strict')
  }

  try {
    const existing = await automation.getCookies({ name: cookie.key })

    if (existing.some((c) => isBlockedByExisting(c, stored, isSecure))) return undo()
  } catch (err) {
    // a failed lookup leaves no way to tell whether the write is allowed
    debug('ignoring document.cookie write %s: %s', cookieString, err.message)

    return undo()
  }

  try {
    await automation.setCookie(toughCookieToAutomationCookie(cookie, pageUrl.hostname))
  } catch (err) {
    // the browser does not have the cookie, so the server-side jar must not either
    undo()

    throw err
  }
}
