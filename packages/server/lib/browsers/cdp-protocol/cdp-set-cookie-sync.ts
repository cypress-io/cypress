import { isDeepStrictEqual } from 'util'
import type { Protocol } from 'devtools-protocol'
import { Cookie, defaultPath } from 'tough-cookie'
import { isHostOnlyCookie } from '../../automation/cookie/util'

/**
 * Chrome saves a response's Set-Cookie headers to its cookie store before it
 * pauses the response for Fetch interception, and neither Fetch.continueResponse
 * nor Fetch.fulfillRequest undoes that. So when a cy.intercept response handler
 * edits, adds or removes Set-Cookie headers, Chrome's store still reflects the
 * origin's headers, not the handler's.
 *
 * This module works out the CDP cookie commands that close that gap. The target
 * is the store the browser ends with on the "proxy path", where the request goes
 * through Cypress's HTTP proxy and the browser only ever sees the handler's
 * headers. Where CDP can't reproduce that exactly, the differences are listed on
 * `planSetCookieSync`.
 */

/**
 * What Chrome reported about this request's cookies before cy.intercept saw the
 * response. `setCookieHeaders…` fields hold raw `Set-Cookie` header values, one
 * per header.
 */
export type CookiesBeforeIntercept = {
  // every Set-Cookie header the origin sent, from
  // Network.responseReceivedExtraInfo
  setCookieHeadersFromOrigin: string[]
  // the headers above that Chrome refused to store
  setCookieHeadersBlockedByChrome: string[]
  // the partition Chrome stored this response's partitioned cookies in; absent
  // when Chrome reports the partition key as opaque and CDP cannot address it
  partitionKey?: Protocol.Network.CookiePartitionKey
}

export type SetCookieSyncCommand =
  | { method: 'Network.setCookie', params: Protocol.Network.SetCookieRequest }
  | { method: 'Network.deleteCookies', params: Protocol.Network.DeleteCookiesRequest }

export type ChromeStoreCookie = Pick<Protocol.Network.Cookie, 'name' | 'value' | 'path' | 'domain' | 'partitionKey'>

// What identifies a cookie in Chrome's store: name, domain, path and partition.
// Chrome reports cookies in this form (`cookiesWhenRequestSent`,
// `getChromeCookieStore`), with the domain already resolved: dotted for a
// domain cookie, the bare host for a host-only one. `parseSetCookie` resolves
// each header the same way (see `cookieStoreDomain`) so the two can be compared.
type ChromeCookieIdentity = Omit<ChromeStoreCookie, 'value'>

type ParsedSetCookie = {
  cookie: Cookie
  // Matches a header against the ones Chrome blocked: name, the header's own
  // Domain=, path, the partitioned flag, and the attributes Chrome stores.
  // Formatting is ignored: a handler's copy of a blocked header that differs
  // only in spacing, casing or attribute order is still blocked. A change to
  // any of those fields makes it a new header, which Chrome didn't block.
  headerFingerprint: string
  // where Chrome stores the cookie, for matching against what Chrome reports
  identity: ChromeCookieIdentity
  priority?: Protocol.Network.CookiePriority
  partitioned: boolean
}

type CookiesByIdentity = Map<string, ParsedSetCookie>

type ReadChromeCookieStore = () => Promise<ChromeStoreCookie[]>

// tough-cookie normalizes SameSite and Priority to lowercase
const CDP_SAME_SITE: Record<string, Protocol.Network.CookieSameSite | undefined> = { strict: 'Strict', lax: 'Lax', none: 'None' }
const CDP_PRIORITY: Record<string, Protocol.Network.CookiePriority | undefined> = { low: 'Low', medium: 'Medium', high: 'High' }

// The proxy middleware adds __cypress.* cookies for its own bookkeeping. They
// are not part of the page's traffic, so they are left out of the sync.
const isInternalCookie = (name: string) => name.startsWith('__cypress.')

// Whether Chrome stores Domain=<host> as a domain cookie. A host with no
// registrable domain (an IP, a single label such as localhost, or a public
// suffix such as github.io or co.uk) can't hold one, so Chrome stores the
// cookie host-only instead. A host like example.test or foo.github.io can.
// `isHostOnlyCookie` is named for the opposite of what it returns here: true
// means a domain cookie is allowed.
const hostAcceptsDomainCookie = (host: string): boolean => !!isHostOnlyCookie({ domain: host })

/**
 * The domain Chrome stores a cookie under, resolved the same way Chrome
 * resolves a Set-Cookie header's Domain= attribute:
 * - no Domain=, or Domain= naming the host itself where that is stored
 *   host-only — under `URL.hostname`. Chrome keeps the brackets on an IPv6
 *   host (`[::1]`), and normalizes an address the same way `URL` does.
 * - any other Domain= — dotted (tough-cookie strips the dot from the header, so
 *   it is added back).
 *
 * Only used for matching a header against what Chrome reports. The commands
 * don't need it: `setParsedCookieCommand` passes the header's own domain and
 * lets Chrome resolve it, and `restoreCookieCommand` already has the resolved
 * form from Chrome.
 */
export const cookieStoreDomain = (cookie: Pick<Cookie, 'domain'>, url: URL): string => {
  const host = url.hostname

  if (!cookie.domain) {
    return host
  }

  if (cookie.domain === host && !hostAcceptsDomainCookie(host)) {
    return host
  }

  return `.${cookie.domain}`
}

// tough-cookie keeps Priority, a Chrome-only attribute, among the extensions
const parsePriority = (cookie: Cookie): Protocol.Network.CookiePriority | undefined => {
  for (const ext of cookie.extensions ?? []) {
    const [name, value] = ext.split('=').map((part) => part.trim().toLowerCase())

    if (name === 'priority') {
      return CDP_PRIORITY[value]
    }
  }

  return undefined
}

// Everything a Set-Cookie header sets on the stored cookie besides its
// identity, as a string to compare: when the origin's and the handler's headers
// for one cookie differ here, the handler changed it and it is written. The raw
// Domain= is left out because it only affects identity, so Domain=localhost and
// no Domain= on localhost don't count as a change.
const cookieContentKey = (parsed: Pick<ParsedSetCookie, 'cookie' | 'priority'>): string => {
  const { cookie, priority } = parsed

  return [
    cookie.value,
    cookie.secure,
    cookie.httpOnly,
    cookie.sameSite ?? '',
    cookie.maxAge ?? '',
    cookie.expires instanceof Date ? cookie.expires.toISOString() : '',
    priority ?? '',
  ].join('\0')
}

const parseSetCookie = (header: string, url: URL, partitionKey: Protocol.Network.CookiePartitionKey | undefined): ParsedSetCookie | undefined => {
  // loose: Chrome stores a header with no `=` as a cookie with an empty name
  const cookie = Cookie.parse(header, { loose: true })

  if (!cookie || isInternalCookie(cookie.key)) {
    return undefined
  }

  const partitioned = !!cookie.extensions?.some((ext) => ext.toLowerCase() === 'partitioned')
  const path = cookie.path ?? defaultPath(url.pathname)
  const priority = parsePriority(cookie)

  // tough-cookie's own serializer omits SameSite=None, which Chrome treats
  // differently from no SameSite at all, so it cannot be used here. The raw
  // Domain= is included so a blocked header matches only that header.
  const headerFingerprint = [cookie.key, cookie.domain ?? '', path, partitioned, cookieContentKey({ cookie, priority })].join('\0')

  const identity: ChromeCookieIdentity = {
    name: cookie.key,
    path,
    domain: cookieStoreDomain(cookie, url),
    ...(partitioned ? { partitionKey } : {}),
  }

  return { cookie, headerFingerprint, identity, priority, partitioned }
}

const parseSetCookieHeaders = (headers: string[], url: URL, partitionKey: Protocol.Network.CookiePartitionKey | undefined): ParsedSetCookie[] => {
  return headers.flatMap((header) => parseSetCookie(header, url, partitionKey) ?? [])
}

// Leaves out two kinds of cookie, on both the origin's and the handler's side:
// - One whose header Chrome blocked in the origin's response. The proxy path
//   would block it again, but Network.setCookie skips the check that blocked
//   it, so it must not be written. Nor does it count as the handler keeping the
//   origin's cookie for that header. Matched by headerFingerprint, so a copy the
//   handler re-serialized still matches.
// - A partitioned cookie when Chrome gave no usable partitionKey. Each
//   top-level site has its own partitioned jar, which CDP can only address by
//   key. Without one, a write would land in the unpartitioned jar and clobber
//   an unrelated cookie, and a lookup can't tell whether Chrome stored it.
const isSyncable = (parsed: ParsedSetCookie, blockedFingerprints: Set<string>, partitionKey: Protocol.Network.CookiePartitionKey | undefined): boolean => {
  return !blockedFingerprints.has(parsed.headerFingerprint) && (!parsed.partitioned || !!partitionKey)
}

// Which stored cookie a header writes to, as a map key: two headers with the
// same key overwrite each other in Chrome's store. Uses the resolved domain,
// not the raw Domain=, so Domain=localhost and no Domain= on localhost share a
// key.
const chromeIdentityKey = (identity: ChromeCookieIdentity): string => {
  const partition = identity.partitionKey

  return [
    identity.name,
    identity.domain,
    identity.path,
    partition?.topLevelSite ?? '',
    partition ? String(partition.hasCrossSiteAncestor) : '',
  ].join('\0')
}

// Keeps the last header for each stored cookie, since Chrome applies a
// response's Set-Cookie headers in order and a later one overwrites an earlier
// one.
const lastCookiePerIdentity = (parsed: ParsedSetCookie[]): CookiesByIdentity => {
  const byIdentity = new Map<string, ParsedSetCookie>()

  for (const cookie of parsed) {
    byIdentity.set(chromeIdentityKey(cookie.identity), cookie)
  }

  return byIdentity
}

const parseSyncableCookies = (url: URL, cookiesBeforeIntercept: CookiesBeforeIntercept, setCookieHeadersAfterIntercept: string[]) => {
  const { setCookieHeadersFromOrigin, setCookieHeadersBlockedByChrome, partitionKey } = cookiesBeforeIntercept
  const blockedFingerprints = new Set(parseSetCookieHeaders(setCookieHeadersBlockedByChrome, url, partitionKey).map(({ headerFingerprint }) => headerFingerprint))

  const syncableCookies = (headers: string[]) => {
    const parsed = parseSetCookieHeaders(headers, url, partitionKey).filter((cookie) => isSyncable(cookie, blockedFingerprints, partitionKey))

    return lastCookiePerIdentity(parsed)
  }

  return {
    cookiesFromOrigin: syncableCookies(setCookieHeadersFromOrigin),
    cookiesAfterIntercept: syncableCookies(setCookieHeadersAfterIntercept),
  }
}

const isSameChromeCookie = (a: ChromeCookieIdentity, b: ChromeCookieIdentity): boolean => {
  return a.name === b.name
    && a.path === b.path
    && a.domain === b.domain
    && isDeepStrictEqual(a.partitionKey, b.partitionKey)
}

const isExpired = (cookie: Cookie): boolean => cookie.expiryTime() <= Date.now()

// Like a Set-Cookie header, Network.setCookie with a past expiry removes the
// cookie. tough-cookie reports Max-Age=0 as -Infinity, which `expires` can't
// take, so any expired cookie gets expires: 1 (1970). undefined means a session
// cookie.
const cdpExpires = (cookie: Cookie): number | undefined => {
  const expiryTime = cookie.expiryTime()

  if (expiryTime === Infinity) {
    return undefined
  }

  return isExpired(cookie) ? 1 : expiryTime / 1000
}

// Network.setCookie resolves the domain and path the way Chrome does for a
// Set-Cookie header, so writing the header's own attributes stores, replaces or
// (with a past expiry) removes the same cookie the header would. An expired
// cookie keeps its value, since Chrome rejects a cookie whose name and value
// are both empty.
const setParsedCookieCommand = (parsed: ParsedSetCookie, url: URL, partitionKey: Protocol.Network.CookiePartitionKey | undefined): SetCookieSyncCommand => {
  const { cookie, priority, partitioned } = parsed
  const expires = cdpExpires(cookie)
  const sameSite = cookie.sameSite ? CDP_SAME_SITE[cookie.sameSite] : undefined

  return {
    method: 'Network.setCookie',
    params: {
      name: cookie.key,
      value: cookie.value,
      // Chrome derives a missing domain and path, and the source scheme, from
      // this url
      url: url.href,
      // tough-cookie strips the leading dot from Domain=. Adding it back makes
      // Network.setCookie treat this as a Domain= cookie, not a host-only one.
      // Chrome still stores it host-only wherever it would for the header
      // (see cookieStoreDomain).
      ...(cookie.domain ? { domain: `.${cookie.domain}` } : {}),
      ...(cookie.path ? { path: cookie.path } : {}),
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      ...(sameSite ? { sameSite } : {}),
      ...(priority ? { priority } : {}),
      ...(expires !== undefined ? { expires } : {}),
      ...(partitioned && partitionKey ? { partitionKey } : {}),
    },
  }
}

// Network.deleteCookies matches domain and path exactly, and with no
// partitionKey only matches unpartitioned cookies, so passing a cookie as
// Chrome stored it removes that one cookie and nothing in another jar.
const deleteCommand = (cookie: ChromeStoreCookie): SetCookieSyncCommand => {
  return {
    method: 'Network.deleteCookies',
    params: {
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path,
      ...(cookie.partitionKey ? { partitionKey: cookie.partitionKey } : {}),
    },
  }
}

// Writes back a cookie exactly as Chrome held it, from the stored form rather
// than a header, so the domain is passed as stored: dotted for a Domain=
// cookie, undotted for a host-only one. A session cookie gets no `expires`, so
// it stays a session cookie.
const restoreCookieCommand = (cookie: Protocol.Network.Cookie): SetCookieSyncCommand => {
  return {
    method: 'Network.setCookie',
    params: {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      ...(cookie.sameSite ? { sameSite: cookie.sameSite } : {}),
      priority: cookie.priority,
      sourceScheme: cookie.sourceScheme,
      sourcePort: cookie.sourcePort,
      ...(cookie.session ? {} : { expires: cookie.expires }),
      ...(cookie.partitionKey ? { partitionKey: cookie.partitionKey } : {}),
    },
  }
}

// Whether Chrome actually stored this origin header, returning the stored
// cookie if so. Chrome reports a header as unblocked even when it stored nothing
// (e.g. the request was sent without credentials), and name, domain and path
// alone could match an older cookie Chrome already held, so the value must
// match too. An older cookie that already had the header's value can't be told
// apart, and is treated as stored from this response.
const findStoredFromHeader = async (originCookie: ParsedSetCookie, readChromeCookieStore: ReadChromeCookieStore): Promise<ChromeStoreCookie | undefined> => {
  const storedCookies = await readChromeCookieStore()

  return storedCookies.find((stored) => isSameChromeCookie(stored, originCookie.identity) && stored.value === originCookie.cookie.value)
}

// Restores the cookie the origin's header overwrote, if Chrome held it when it
// sent the request, whether or not it was sent. Matching
// errs toward restoring: rewriting a cookie the header didn't touch leaves it
// unchanged, but missing one leaves it deleted.
const restoreReplacedCookieCommands = (originCookie: ParsedSetCookie, cookiesWhenRequestSent: Protocol.Network.Cookie[]): SetCookieSyncCommand[] => {
  return cookiesWhenRequestSent
  .filter((cookie) => isSameChromeCookie(cookie, originCookie.identity))
  .map(restoreCookieCommand)
}

// Undoes what one of the origin's headers did:
// - An expired header is a deletion, and Chrome never stores an expired
//   cookie, so the header alone says what Chrome did and the store isn't
//   read: only the cookie it deleted is restored. If the request had no
//   credentials, Chrome ignored the deletion and the restore rewrites the
//   cookie it still holds unchanged.
// - Otherwise the stored cookie is deleted and the one it overwrote restored.
// - If Chrome doesn't hold the origin's value, nothing was stored from this
//   response, so nothing is done.
const removeOriginCookieCommands = async (
  originCookie: ParsedSetCookie,
  cookiesWhenRequestSent: Protocol.Network.Cookie[],
  readChromeCookieStore: ReadChromeCookieStore,
): Promise<SetCookieSyncCommand[]> => {
  if (isExpired(originCookie.cookie)) {
    return restoreReplacedCookieCommands(originCookie, cookiesWhenRequestSent)
  }

  const storedCookie = await findStoredFromHeader(originCookie, readChromeCookieStore)

  return storedCookie ? [deleteCommand(storedCookie), ...restoreReplacedCookieCommands(originCookie, cookiesWhenRequestSent)] : []
}

// Removes the cookies the origin set that the handler dropped.
const planRemovals = async ({
  cookiesFromOrigin,
  cookiesAfterIntercept,
  cookiesWhenRequestSent,
  readChromeCookieStore,
}: {
  cookiesFromOrigin: CookiesByIdentity
  cookiesAfterIntercept: CookiesByIdentity
  cookiesWhenRequestSent: Protocol.Network.Cookie[]
  readChromeCookieStore: ReadChromeCookieStore
}): Promise<SetCookieSyncCommand[]> => {
  const cookiesRemovedByIntercept = [...cookiesFromOrigin.values()].filter((originCookie) => {
    return !cookiesAfterIntercept.has(chromeIdentityKey(originCookie.identity))
  })
  const commands = await Promise.all(cookiesRemovedByIntercept.map((originCookie) => removeOriginCookieCommands(originCookie, cookiesWhenRequestSent, readChromeCookieStore)))

  return commands.flat()
}

// Writes the cookies the handler added or changed.
const planWrites = async ({
  cookiesFromOrigin,
  cookiesAfterIntercept,
  url,
  partitionKey,
  readChromeCookieStore,
}: {
  cookiesFromOrigin: CookiesByIdentity
  cookiesAfterIntercept: CookiesByIdentity
  url: URL
  partitionKey: Protocol.Network.CookiePartitionKey | undefined
  readChromeCookieStore: ReadChromeCookieStore
}): Promise<SetCookieSyncCommand[]> => {
  const cookiesAddedOrChangedByIntercept = [...cookiesAfterIntercept.values()].filter((handlerCookie) => {
    const originCookie = cookiesFromOrigin.get(chromeIdentityKey(handlerCookie.identity))

    // an unchanged header is already in Chrome's store, so it needs no write
    return !originCookie || cookieContentKey(originCookie) !== cookieContentKey(handlerCookie)
  })

  if (!cookiesAddedOrChangedByIntercept.length) {
    return []
  }

  // Chrome never stores an expired cookie, so only the unexpired ones can show
  // whether Chrome stored anything from this response.
  const unexpiredCookiesFromOrigin = [...cookiesFromOrigin.values()].filter(({ cookie }) => !isExpired(cookie))
  const storedFromOrigin = await Promise.all(unexpiredCookiesFromOrigin.map((originCookie) => findStoredFromHeader(originCookie, readChromeCookieStore)))

  // The browser ignores Set-Cookie when the request was sent without
  // credentials, but Network.setCookie doesn't. If Chrome stored none of the
  // origin's cookies, the request was sent without credentials, so nothing is
  // written. If the origin set no cookies, or only expired ones, the store
  // can't tell, so the writes go ahead as they would with credentials.
  if (unexpiredCookiesFromOrigin.length && !storedFromOrigin.some(Boolean)) {
    return []
  }

  return cookiesAddedOrChangedByIntercept.map((parsed) => setParsedCookieCommand(parsed, url, partitionKey))
}

const parseUrl = (rawUrl: string): URL | undefined => {
  try {
    return new URL(rawUrl)
  } catch {
    return undefined
  }
}

/**
 * Returns the CDP cookie commands, in order, that change Chrome's cookie store
 * from what the origin's Set-Cookie headers stored to what the handler's
 * headers describe. Headers are compared by the cookie Chrome stores (name,
 * resolved domain, path and partition), and the later header for that cookie
 * replaces an earlier one. Two headers can name one stored cookie, such as
 * `Domain=localhost` and no `Domain=` on localhost. If the handler drops
 * one, the other still sets that cookie, so it is not removed, only rewritten
 * if the remaining header differs from the one Chrome applied last.
 *
 * - A cookie the origin set that the handler no longer has is removed, and its
 *   earlier copy is restored from `cookiesWhenRequestSent` if Chrome held it,
 *   even one it didn't send (e.g. blocked by SameSite, or on another path).
 *   On the proxy path the browser only sees the handler's headers, so the
 *   origin's cookie is never stored and the earlier copy is left as it was.
 * - A cookie the handler added or changed is set, or removed if it is already
 *   expired. Skipped when `includeWrites` is false.
 *
 * Removals come before writes, and the two never touch the same stored cookie:
 * removals only cover cookies the handler dropped, and writes only cookies it
 * added or changed.
 *
 * Chrome stores nothing from a response to a request sent without credentials,
 * yet still reports its headers as unblocked, so Chrome's store is checked to
 * see what this response actually stored:
 * - A removal only happens if Chrome holds the origin's value. Otherwise the
 *   cookie in the store is an older one this response never touched, and
 *   deleting it would remove a cookie the proxy path keeps.
 * - Nothing is written if the origin set cookies but Chrome holds none of them,
 *   since the browser would have ignored the handler's headers too.
 *
 * Chrome's store is read at most once, and only when one of these checks is
 * needed.
 *
 * The result differs from the proxy path in two ways:
 * - Network.setCookie skips Chrome's cookie-blocking checks, third-party cookie
 *   rules included, so a cookie the handler adds or edits is stored even where
 *   Chrome would have refused the same header in a response.
 * - If the origin set no cookies, or only expired ones (so Chrome does not
 *   store anything), the handler's cookies are written even when the request
 *   was sent without credentials, where the browser would have ignored them.
 *   With no origin cookie to look for in Chrome's store, there's no way to
 *   tell whether credentials were sent.
 */
export async function planSetCookieSync ({
  url: rawUrl,
  cookiesWhenRequestSent,
  cookiesBeforeIntercept,
  setCookieHeadersAfterIntercept,
  includeWrites,
  getChromeCookieStore,
}: {
  url: string
  // Chrome's whole cookie store before this response stored anything
  cookiesWhenRequestSent: Protocol.Network.Cookie[]
  cookiesBeforeIntercept: CookiesBeforeIntercept
  // the Set-Cookie headers the response is released with, after cy.intercept ran
  setCookieHeadersAfterIntercept: string[]
  // false when the response is fulfilled with the handler's headers: the plan
  // then only removes cookies the origin set that the handler dropped, and
  // leaves the handler's new or changed cookies for Chrome to store
  includeWrites: boolean
  // Chrome's cookie store after it processed the origin's headers
  getChromeCookieStore: () => Promise<ChromeStoreCookie[]>
}): Promise<SetCookieSyncCommand[]> {
  const { setCookieHeadersFromOrigin, partitionKey } = cookiesBeforeIntercept

  // the handler left the origin's Set-Cookie headers untouched, so Chrome's
  // store already matches them
  if (isDeepStrictEqual(setCookieHeadersAfterIntercept, setCookieHeadersFromOrigin)) {
    return []
  }

  // a cookie's default domain and path come from the url, so without a valid
  // one no cookie can be matched to what Chrome stored
  const url = parseUrl(rawUrl)

  if (!url) {
    return []
  }

  const { cookiesFromOrigin, cookiesAfterIntercept } = parseSyncableCookies(url, cookiesBeforeIntercept, setCookieHeadersAfterIntercept)

  let chromeCookieStore: Promise<ChromeStoreCookie[]> | undefined

  const readChromeCookieStore = () => {
    chromeCookieStore ??= getChromeCookieStore()

    return chromeCookieStore
  }

  // Fulfilling never removes what the origin's headers stored, so removals are
  // planned regardless of `includeWrites`.
  const removals = await planRemovals({ cookiesFromOrigin, cookiesAfterIntercept, cookiesWhenRequestSent, readChromeCookieStore })

  if (!includeWrites) {
    return removals
  }

  const writes = await planWrites({ cookiesFromOrigin, cookiesAfterIntercept, url, partitionKey, readChromeCookieStore })

  return [...removals, ...writes]
}
