import Debug from 'debug'
import { CookieJar as ToughCookieJar } from 'tough-cookie'
import type { Cookie } from 'tough-cookie'
import { isSecureUrl } from '@packages/network-tools'
import { cookieJar, toughCookieToAutomationCookie, writtenToJar } from './jar'
import type { SerializableAutomationCookie } from './jar'
import { isBlockedByExisting, isExpired, isSameCookie, meetsDocumentCookieRules, parseDocumentCookie } from './document-cookie-rules'
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

// a write that failed after a later write replaced it, mapped to the cookie it had replaced
const undone = new WeakMap<Cookie, Cookie | undefined>()

// the newest write in flight for each cookie
const latest = new Map<string, Cookie>()

// the browser handles the writes to one cookie in the order the page made them
const queue = new Map<string, Promise<void>>()

// how many writes to each cookie are waiting for the browser before they write the jar
const heldBack = new Map<string, number>()

// the jar generation the two maps above belong to
let trackedGeneration = 0

const DOCUMENT_COOKIE_WRITE_TIMEOUT = 5000

class BrowserTimeout extends Error {}

// automation requests have no timeout, and a write the browser never answers must not hold up the writes behind it
const answered = <T>(request: Promise<T>) => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new BrowserTimeout('the browser did not answer')), DOCUMENT_COOKIE_WRITE_TIMEOUT)

    request.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

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

  const key = JSON.stringify(stored)
  const findStored = () => cookieJar.getAllCookies().find((c) => isSameCookie({ name: c.key, domain: c.domain || '', path: c.path }, stored))
  const { generation } = cookieJar

  if (generation !== trackedGeneration) {
    latest.clear()
    heldBack.clear()
    trackedGeneration = generation
  }

  // the jar was emptied after the page made this write, and the write must not bring anything back
  const isCleared = () => cookieJar.generation !== generation
  let replaced: Cookie | undefined
  let written: Cookie | undefined

  const write = () => {
    if (isCleared()) return false

    // a jar read may have purged the expired cookie of a write still in flight
    replaced = findStored() ?? latest.get(key)

    // tough-cookie refuses to replace an HttpOnly cookie. one still in the jar here has
    // expired, or the browser has answered that it no longer holds it
    if (replaced && (isExpired(replaced) || replaced.httpOnly)) cookieJar.removeCookie(stored)

    try {
      cookieJar.setCookie(cookie, pageUrl.href, 'strict', { http: false })
      written = findStored()

      if (written) latest.set(key, written)
    } catch (err) {
      debug('ignoring document.cookie write %s: %s', cookieString, err.message)
    }

    return !!written
  }

  const undo = () => {
    if (!written || isCleared()) return

    const current = findStored()

    // a later write to the same cookie owns the entry now, and must not restore this one.
    // a jar read purges an expired cookie, which leaves its write the owner
    if (current !== written && (current || !isExpired(written) || latest.get(key) !== written)) {
      undone.set(written, replaced)

      return
    }

    let restored = replaced

    while (restored && undone.has(restored)) {
      restored = undone.get(restored)
    }

    cookieJar.removeCookie(stored)

    if (restored) {
      const { creation } = restored

      cookieJar.setCookie(restored, pageUrl.href, 'strict')
      // a Max-Age cookie expires relative to its creation, which setting it again resets
      restored.creation = creation
    }
  }

  const isBlockedInJar = cookieJar.getAllCookies().some((c) => {
    return !isExpired(c) && isBlockedByExisting({ name: c.key, domain: c.domain || '', path: c.path, httpOnly: c.httpOnly, secure: c.secure }, stored, isSecure)
  })

  // the jar may be behind the browser, so a write its cookies block waits for the browser's
  // answer, and so does a write that follows one still waiting
  const isHeldBack = isBlockedInJar || heldBack.has(key)

  if (isHeldBack) {
    heldBack.set(key, (heldBack.get(key) ?? 0) + 1)
  // set before the browser answers, so a request the page makes right after the write carries the cookie
  } else if (!write()) {
    return
  }

  const sendToBrowser = async () => {
    try {
      const existing = await answered(automation.getCookies({ name: cookie.key }))

      // a browser can still return a cookie that has expired
      const isLive = (c: ExistingCookie) => typeof c.expiry !== 'number' || c.expiry * 1000 > Date.now()

      if (existing.some((c) => isLive(c) && isBlockedByExisting(c, stored, isSecure))) return undo()
    } catch (err) {
      // a failed lookup leaves no way to tell whether the write is allowed
      debug('ignoring document.cookie write %s: %s', cookieString, err.message)

      return undo()
    }

    if (isCleared() || (isHeldBack && !write())) return

    const automationCookie = toughCookieToAutomationCookie(cookie, pageUrl.hostname)

    writtenToJar.add(automationCookie)

    try {
      await answered(automation.setCookie(automationCookie))
    } catch (err) {
      // the browser was told to set the cookie, and may still do it
      if (err instanceof BrowserTimeout) return

      // the browser does not have the cookie, so the server-side jar must not either
      undo()

      throw err
    }
  }

  const previous = queue.get(key)
  const sent = previous ? previous.then(sendToBrowser) : sendToBrowser()
  const settled = sent.catch(() => {})

  queue.set(key, settled)

  try {
    await sent
  } finally {
    if (queue.get(key) === settled) queue.delete(key)

    if (written && latest.get(key) === written) latest.delete(key)

    if (isHeldBack && !isCleared()) {
      const count = (heldBack.get(key) ?? 1) - 1

      count ? heldBack.set(key, count) : heldBack.delete(key)
    }
  }
}
