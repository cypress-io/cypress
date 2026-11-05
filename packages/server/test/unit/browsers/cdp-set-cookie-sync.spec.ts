import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Protocol } from 'devtools-protocol'
import { Cookie, defaultPath } from 'tough-cookie'
import { cookieStoreDomain, planSetCookieSync } from '../../../lib/browsers/cdp-protocol/cdp-set-cookie-sync'
import type { ChromeStoreCookie, CookiesBeforeIntercept, SetCookieSyncCommand } from '../../../lib/browsers/cdp-protocol/cdp-set-cookie-sync'

const REQUEST_URL = 'https://api.example.test/a/b'

const partitionKey: Protocol.Network.CookiePartitionKey = {
  topLevelSite: 'https://app.example.test',
  hasCrossSiteAncestor: true,
}

async function plan (options: {
  setCookieHeadersFromOrigin: string[]
  setCookieHeadersAfterIntercept: string[]
  setCookieHeadersBlockedByChrome?: string[]
  partitionKey?: Protocol.Network.CookiePartitionKey
  includeWrites?: boolean
  url?: string
  // what Chrome's cookie store holds after the origin's response. Defaults to
  // every origin cookie Chrome didn't block, which is what Chrome stores when
  // the request was sent with credentials.
  chromeCookieStore?: ChromeStoreCookie[]
  // Chrome's whole cookie store before the response
  cookiesWhenRequestSent?: Protocol.Network.Cookie[]
}) {
  const url = options.url ?? REQUEST_URL
  const parsedUrl = URL.canParse(url) ? new URL(url) : undefined

  const chromeCookieStoreByDefault: ChromeStoreCookie[] = options.setCookieHeadersFromOrigin
  .filter((header) => !options.setCookieHeadersBlockedByChrome?.includes(header))
  .flatMap((header) => {
    const cookie = Cookie.parse(header, { loose: true })

    return cookie && parsedUrl ? [{
      name: cookie.key,
      value: cookie.value,
      path: cookie.path ?? defaultPath(parsedUrl.pathname),
      domain: cookieStoreDomain(cookie, parsedUrl),
      ...(/;\s*partitioned/i.test(header) ? { partitionKey: options.partitionKey } : {}),
    }] : []
  })

  const cookiesBeforeIntercept: CookiesBeforeIntercept = {
    setCookieHeadersFromOrigin: options.setCookieHeadersFromOrigin,
    setCookieHeadersBlockedByChrome: options.setCookieHeadersBlockedByChrome ?? [],
    ...(options.partitionKey ? { partitionKey: options.partitionKey } : {}),
  }

  return planSetCookieSync({
    url,
    cookiesWhenRequestSent: options.cookiesWhenRequestSent ?? [],
    cookiesBeforeIntercept,
    setCookieHeadersAfterIntercept: options.setCookieHeadersAfterIntercept,
    includeWrites: options.includeWrites ?? true,
    getChromeCookieStore: async () => options.chromeCookieStore ?? chromeCookieStoreByDefault,
  })
}

function set (params: Protocol.Network.SetCookieRequest): SetCookieSyncCommand {
  return { method: 'Network.setCookie', params }
}

// a removal targets the name, domain and path Chrome stored the cookie under,
// which can differ from the attributes in the header
function removal (params: Protocol.Network.DeleteCookiesRequest): SetCookieSyncCommand {
  return { method: 'Network.deleteCookies', params }
}

// when the handler's header is already expired, the cookie is written with
// expires: 1 (a date in 1970). Chrome then deletes the cookie, just as it would
// for the header.
function expiry (params: Partial<Protocol.Network.SetCookieRequest>) {
  return { method: 'Network.setCookie', params: expect.objectContaining({ ...params, expires: 1 }) }
}

function cookieWhenRequestSent (overrides: Partial<Protocol.Network.Cookie>): Protocol.Network.Cookie {
  return {
    name: 'a',
    value: 'before',
    domain: 'api.example.test',
    path: '/',
    expires: Date.parse('2030-01-01T00:00:00Z') / 1000,
    size: 7,
    httpOnly: false,
    secure: true,
    session: false,
    sameSite: 'None',
    priority: 'Medium',
    sourceScheme: 'Secure',
    sourcePort: 443,
    ...overrides,
  }
}

// every cookie the plan sets, as name=value, including cookies it puts back
function cookiesSet (commands: SetCookieSyncCommand[]) {
  return commands.flatMap(({ method, params }) => method === 'Network.setCookie' ? [`${params.name}=${params.value}`] : [])
}

describe('planSetCookieSync', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('plans nothing when the handler only reformatted a header', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Path=/; Secure; SameSite=None'],
      setCookieHeadersAfterIntercept: ['a=1;samesite=none;secure;path=/'],
    })).toEqual([])
  })

  it('sets a cookie whose value was rewritten', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Path=/; Secure; SameSite=None'],
      setCookieHeadersAfterIntercept: ['a=2; Path=/; Secure; SameSite=None'],
    })).toEqual([set({
      name: 'a',
      value: '2',
      url: REQUEST_URL,
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'None',
    })])
  })

  // Chrome treats a missing SameSite as Lax, so adding None is a real change
  it('sets a cookie whose only change is an explicit SameSite=None', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Secure'],
      setCookieHeadersAfterIntercept: ['a=1; Secure; SameSite=None'],
    })).toEqual([set({
      name: 'a',
      value: '1',
      url: REQUEST_URL,
      secure: true,
      httpOnly: false,
      sameSite: 'None',
    })])
  })

  it('keeps Priority when setting a rewritten cookie', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Priority=High'],
      setCookieHeadersAfterIntercept: ['a=2; Priority=High'],
    })).toEqual([set({
      name: 'a',
      value: '2',
      url: REQUEST_URL,
      secure: false,
      httpOnly: false,
      priority: 'High',
    })])
  })

  it('sets a cookie whose only change is its Priority', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Priority=Low'],
      setCookieHeadersAfterIntercept: ['a=1; priority=high'],
    })).toEqual([set({
      name: 'a',
      value: '1',
      url: REQUEST_URL,
      secure: false,
      httpOnly: false,
      priority: 'High',
    })])
  })

  it('sets a cookie the handler added', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: [],
      setCookieHeadersAfterIntercept: ['added=1; HttpOnly'],
    })).toEqual([set({
      name: 'added',
      value: '1',
      url: REQUEST_URL,
      secure: false,
      httpOnly: true,
    })])
  })

  it('removes a host-only cookie the handler dropped, at its default path', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1', 'b=2'],
      setCookieHeadersAfterIntercept: ['b=2'],
    })).toEqual([removal({ name: 'a', domain: 'api.example.test', path: '/a' })])
  })

  // Chrome stores a Domain= cookie under the domain with a leading dot
  // (`.example.test`), so the removal uses that form. The write passes the
  // dotted domain too, and Chrome decides where to store it the same way it
  // would for the header (for example, host-only on a public suffix).
  it('addresses a Domain= cookie by its dotted domain', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Domain=.example.test; Path=/'],
      setCookieHeadersAfterIntercept: [],
    })).toEqual([removal({ name: 'a', domain: '.example.test', path: '/' })])

    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Domain=example.test; Path=/'],
      setCookieHeadersAfterIntercept: ['a=1; Domain=example.test; Path=/; SameSite=None; Secure'],
    })).toEqual([set({
      name: 'a',
      value: '1',
      url: REQUEST_URL,
      domain: '.example.test',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'None',
    })])
  })

  // Chrome stores Domain=<public suffix> as host-only under the bare host
  // (`github.io`, not `.github.io`), so matching on the dotted form would miss
  // the stored cookie and skip the write
  it('matches Domain=<public suffix> against the host-only cookie Chrome stored', async () => {
    expect(cookieStoreDomain({ domain: 'github.io' }, new URL('https://github.io/'))).toBe('github.io')
    expect(cookieStoreDomain({ domain: 'co.uk' }, new URL('https://co.uk/'))).toBe('co.uk')
    expect(cookieStoreDomain({ domain: null }, new URL('https://github.io/'))).toBe('github.io')
    expect(cookieStoreDomain({ domain: 'foo.github.io' }, new URL('https://foo.github.io/'))).toBe('.foo.github.io')

    // the write still passes the dotted `.github.io`. Chrome stores it
    // host-only, the same as it would for the header.
    expect(await plan({
      url: 'https://github.io/',
      setCookieHeadersFromOrigin: ['a=1; Domain=github.io; Path=/'],
      setCookieHeadersAfterIntercept: ['a=2; Domain=github.io; Path=/'],
      chromeCookieStore: [{ name: 'a', value: '1', path: '/', domain: 'github.io' }],
    })).toEqual([set({
      name: 'a',
      value: '2',
      url: 'https://github.io/',
      domain: '.github.io',
      path: '/',
      secure: false,
      httpOnly: false,
    })])
  })

  // Chrome stores an IPv6 host's cookies under the bracketed host (`[::1]`), the
  // form URL.hostname gives. An address can't hold a domain cookie, so
  // Domain=[::1] is stored host-only under the same form. Chrome blocks the
  // unbracketed Domain=::1, so that header never reaches the sync.
  it('matches an IPv6 host as the bracketed host-only cookie Chrome stored', async () => {
    const loopback = new URL('http://[::1]/')

    expect(cookieStoreDomain({ domain: null }, loopback)).toBe('[::1]')
    expect(cookieStoreDomain({ domain: '[::1]' }, loopback)).toBe('[::1]')
    // Chrome and URL.hostname both normalize an IPv4-mapped address
    expect(cookieStoreDomain({ domain: null }, new URL('http://[::ffff:127.0.0.1]/'))).toBe('[::ffff:7f00:1]')

    expect(await plan({
      url: 'http://[::1]/',
      setCookieHeadersFromOrigin: ['a=1; Path=/'],
      setCookieHeadersAfterIntercept: ['a=2; Path=/'],
      chromeCookieStore: [{ name: 'a', value: '1', path: '/', domain: '[::1]' }],
    })).toEqual([set({
      name: 'a',
      value: '2',
      url: 'http://[::1]/',
      path: '/',
      secure: false,
      httpOnly: false,
    })])

    expect(await plan({
      url: 'http://[::1]/',
      setCookieHeadersFromOrigin: ['a=1; Domain=[::1]; Path=/'],
      setCookieHeadersAfterIntercept: [],
      chromeCookieStore: [{ name: 'a', value: '1', path: '/', domain: '[::1]' }],
    })).toEqual([removal({ name: 'a', domain: '[::1]', path: '/' })])
  })

  // Chrome stores `Domain=localhost` as the same host-only cookie as no
  // `Domain=`, so the handler's a=2 overwrites that cookie and the original
  // isn't removed first
  it('treats Domain=localhost and no Domain= as the same cookie on localhost', async () => {
    expect(await plan({
      url: 'http://localhost:3000/',
      setCookieHeadersFromOrigin: ['a=1; Domain=localhost; Path=/'],
      setCookieHeadersAfterIntercept: ['a=2; Path=/'],
    })).toEqual([set({
      name: 'a',
      value: '2',
      url: 'http://localhost:3000/',
      path: '/',
      secure: false,
      httpOnly: false,
    })])
  })

  // Chrome stores a line with no `=` as a cookie with an empty name
  it('syncs a nameless cookie', async () => {
    // dropping `token` removes it by its empty name, since deleteCookies
    // matches on name, domain and path, never on value
    expect(await plan({
      setCookieHeadersFromOrigin: ['token; Path=/', 'b=2'],
      setCookieHeadersAfterIntercept: ['b=2'],
    })).toEqual([removal({ name: '', domain: 'api.example.test', path: '/' })])

    // Chrome's cookie with the empty name ('') holds the value `other`, not
    // `token`, so this response's cookie was never stored and there is nothing
    // to remove
    expect(await plan({
      setCookieHeadersFromOrigin: ['token; Path=/'],
      setCookieHeadersAfterIntercept: [],
      chromeCookieStore: [{ name: '', value: 'other', path: '/', domain: 'api.example.test' }],
    })).toEqual([])

    // a rewrite keeps the empty name and writes the new line as the value
    expect(await plan({
      setCookieHeadersFromOrigin: ['token; Path=/'],
      setCookieHeadersAfterIntercept: ['rotated; Path=/'],
    })).toEqual([set({
      name: '',
      value: 'rotated',
      url: REQUEST_URL,
      path: '/',
      secure: false,
      httpOnly: false,
    })])
  })

  // the same name, value and path on another domain is a different cookie
  it('does not remove a same-named cookie stored on another domain', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Path=/'],
      setCookieHeadersAfterIntercept: [],
      chromeCookieStore: [{ name: 'a', value: '1', path: '/', domain: 'other.example.test' }],
    })).toEqual([])
  })

  describe('when the handler drops a cookie the browser already held', () => {
    // e.g. a login cookie the server re-sends unchanged on every response to
    // extend it
    it('puts back the cookie the request carried when the origin re-sent the same value', async () => {
      const sentCookie = cookieWhenRequestSent({ value: '1' })

      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/; Secure; SameSite=None'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [sentCookie],
      })).toEqual([
        // remove what the origin's header stored
        removal({ name: 'a', domain: 'api.example.test', path: '/' }),
        // put back the copy the request carried, as Chrome held it
        set({
          name: 'a',
          value: '1',
          domain: 'api.example.test',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'None',
          priority: 'Medium',
          sourceScheme: 'Secure',
          sourcePort: 443,
          expires: sentCookie.expires,
        }),
      ])
    })

    it('puts back the earlier value the origin\'s header overwrote', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=new; Path=/'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [cookieWhenRequestSent({ value: 'old' })],
      })).toEqual([
        removal({ name: 'a', domain: 'api.example.test', path: '/' }),
        { method: 'Network.setCookie', params: expect.objectContaining({ name: 'a', value: 'old' }) },
      ])
    })

    // Chrome reports a session cookie with expires: -1, but setCookie reads
    // expires as a timestamp, so passing it on would write the cookie already
    // expired. Leaving it out is what keeps it a session cookie.
    it('puts back a session cookie without an expiry', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=new; Path=/'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [cookieWhenRequestSent({ value: 'before', session: true, expires: -1 })],
      })).toEqual([
        removal({ name: 'a', domain: 'api.example.test', path: '/' }),
        // no `expires`
        set({
          name: 'a',
          value: 'before',
          domain: 'api.example.test',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'None',
          priority: 'Medium',
          sourceScheme: 'Secure',
          sourcePort: 443,
        }),
      ])
    })

    it('puts back a Domain= cookie with its dotted domain', async () => {
      const sentCookie = cookieWhenRequestSent({ value: 'before', domain: '.example.test' })

      expect(await plan({
        setCookieHeadersFromOrigin: ['a=new; Domain=example.test; Path=/'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [sentCookie],
      })).toEqual([
        removal({ name: 'a', domain: '.example.test', path: '/' }),
        set({
          name: 'a',
          value: 'before',
          domain: '.example.test',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'None',
          priority: 'Medium',
          sourceScheme: 'Secure',
          sourcePort: 443,
          expires: sentCookie.expires,
        }),
      ])
    })

    // Chrome lists a cookie on a path the request doesn't match, blocked with
    // NotOnPath, so it can be put back too
    it('puts back a cookie on a path the request does not match', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=new; Path=/other'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [cookieWhenRequestSent({ value: 'before', path: '/other' })],
      })).toEqual([
        removal({ name: 'a', domain: 'api.example.test', path: '/other' }),
        { method: 'Network.setCookie', params: expect.objectContaining({ name: 'a', value: 'before', path: '/other' }) },
      ])
    })

    // each sent cookie differs from the dropped one in exactly one field
    it('only puts back a cookie with the same name, path and domain', async () => {
      const dropped = { name: 'a', domain: 'api.example.test', path: '/' }

      expect(await plan({
        setCookieHeadersFromOrigin: ['a=new; Path=/'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [
          cookieWhenRequestSent({ ...dropped, name: 'b' }),
          cookieWhenRequestSent({ ...dropped, path: '/a' }),
          cookieWhenRequestSent({ ...dropped, domain: 'other.example.test' }),
        ],
      })).toEqual([removal(dropped)])
    })

    // each sent cookie has the dropped one's name, domain and path, and differs
    // only in its partition
    it('puts back a partitioned cookie only from the same partition', async () => {
      const dropped = { name: 'a', domain: 'api.example.test', path: '/' }
      const sentCookie = cookieWhenRequestSent({ ...dropped, value: 'mine', partitionKey })

      expect(await plan({
        partitionKey,
        setCookieHeadersFromOrigin: ['a=new; Path=/; Secure; SameSite=None; Partitioned'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [
          cookieWhenRequestSent({ ...dropped, value: 'other-top-level-site', partitionKey: { ...partitionKey, topLevelSite: 'https://elsewhere.test' } }),
          cookieWhenRequestSent({ ...dropped, value: 'no-cross-site-ancestor', partitionKey: { ...partitionKey, hasCrossSiteAncestor: false } }),
          // the only one restored: it's in the partition the origin's header wrote to
          sentCookie,
          cookieWhenRequestSent({ ...dropped, value: 'unpartitioned' }),
        ],
      })).toEqual([
        removal({ ...dropped, partitionKey }),
        set({
          ...dropped,
          value: 'mine',
          secure: true,
          httpOnly: false,
          sameSite: 'None',
          priority: 'Medium',
          sourceScheme: 'Secure',
          sourcePort: 443,
          expires: sentCookie.expires,
          partitionKey,
        }),
      ])
    })

    // a partition is its top-level site plus whether it has a cross-site
    // ancestor; here only the cross-site ancestor differs
    it('does not remove a cookie Chrome holds only in a different partition', async () => {
      expect(await plan({
        partitionKey,
        setCookieHeadersFromOrigin: ['a=new; Path=/; Secure; SameSite=None; Partitioned'],
        setCookieHeadersAfterIntercept: [],
        chromeCookieStore: [{ name: 'a', value: 'new', path: '/', domain: 'api.example.test', partitionKey: { ...partitionKey, hasCrossSiteAncestor: false } }],
      })).toEqual([])
    })

    // Chrome has already stored the origin's cookie by the time the response is
    // fulfilled, and fulfilling doesn't undo that. So the removal and the
    // put-back still run when writes are off.
    it('puts it back on a fulfilled response too', async () => {
      expect(await plan({
        includeWrites: false,
        setCookieHeadersFromOrigin: ['a=new; Path=/'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [cookieWhenRequestSent({ value: 'old' })],
      })).toEqual([
        removal({ name: 'a', domain: 'api.example.test', path: '/' }),
        { method: 'Network.setCookie', params: expect.objectContaining({ name: 'a', value: 'old' }) },
      ])
    })

    // on the proxy path, the browser sees the handler's Max-Age=0 header and
    // deletes the cookie, so the old value is not put back
    it('does not put back a cookie the handler expires', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=new; Path=/'],
        setCookieHeadersAfterIntercept: ['a=new; Path=/; Max-Age=0'],
        cookiesWhenRequestSent: [cookieWhenRequestSent({ value: 'old' })],
      })).toEqual([expiry({ name: 'a', value: 'new' })])
    })

    // CDP doesn't say whether the request was sent with credentials. The sign
    // is that Chrome still holds `loggedin`, not the origin's `anon`, so this
    // response stored nothing and there is nothing to undo.
    it('leaves the cookie alone when the request was sent without credentials', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=anon; Path=/'],
        setCookieHeadersAfterIntercept: [],
        cookiesWhenRequestSent: [cookieWhenRequestSent({ value: 'loggedin' })],
        chromeCookieStore: [{ name: 'a', value: 'loggedin', path: '/', domain: 'api.example.test' }],
      })).toEqual([])
    })
  })

  // a different path is a different cookie, so the original has to go
  it('removes the original when a rewrite moves it to another path', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Path=/'],
      setCookieHeadersAfterIntercept: ['a=1; Path=/other'],
    })).toEqual([removal({ name: 'a', domain: 'api.example.test', path: '/' }), set({ name: 'a', value: '1', url: REQUEST_URL, path: '/other', secure: false, httpOnly: false })])
  })

  // Chrome stored nothing from a blocked header, so any cookie matching its
  // name, domain and path is an older one Chrome kept, and must not be deleted.
  // Here the older cookie also has the same value (a=1). The value check can't
  // tell that apart from a cookie this response stored, so only the blocked
  // check prevents the removal.
  it('never removes a cookie for a header Chrome blocked', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; SameSite=Lax'],
      setCookieHeadersBlockedByChrome: ['a=1; SameSite=Lax'],
      setCookieHeadersAfterIntercept: [],
      chromeCookieStore: [{ name: 'a', value: '1', path: '/a', domain: 'api.example.test' }],
    })).toEqual([])
  })

  // blocked headers are matched by their parsed attributes, not their exact
  // text. A text match would miss `a=1;samesite=lax`, treat it as a new
  // cookie, and write it even though Chrome blocked it.
  it('recognizes a blocked header the handler re-serialized', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; SameSite=Lax'],
      setCookieHeadersBlockedByChrome: ['a=1; SameSite=Lax'],
      setCookieHeadersAfterIntercept: ['a=1;samesite=lax'],
    })).toEqual([])
  })

  it('converts Max-Age into an absolute expiry', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1'],
      setCookieHeadersAfterIntercept: ['a=1; Max-Age=60'],
    })).toMatchObject([{ params: { name: 'a', expires: Date.parse('2026-01-01T00:01:00Z') / 1000 } }])
  })

  // Max-Age=0 and a past Expires both mean already expired. tough-cookie
  // reports Max-Age=0 as -Infinity, which `expires` can't take, so both are
  // written with the same past expiry.
  it('writes an already-expired rewrite with a past expiry to remove the cookie', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Path=/'],
      setCookieHeadersAfterIntercept: ['a=1; Path=/; Max-Age=0'],
    })).toEqual([expiry({ name: 'a', path: '/' })])

    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; Path=/'],
      setCookieHeadersAfterIntercept: ['a=1; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'],
    })).toEqual([expiry({ name: 'a', path: '/' })])
  })

  describe('when a key repeats within a response', () => {
    it('writes only the last cookie for the key', async () => {
      expect(cookiesSet(await plan({
        setCookieHeadersFromOrigin: ['a=1'],
        setCookieHeadersAfterIntercept: ['a=2', 'a=3'],
      }))).toEqual(['a=3'])
    })

    // the last header, a=1, wins, and Chrome already holds a=1
    it('writes nothing when the last cookie matches what Chrome stored', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/'],
        setCookieHeadersAfterIntercept: ['a=2; Path=/', 'a=1; Path=/'],
      })).toEqual([])
    })

    // the origin sent a=1 then a=2, so Chrome holds a=2 and the handler's
    // remaining a=1 has to be written
    it('writes the origin\'s earlier value when the handler drops the later header', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'a=2; Path=/'],
        setCookieHeadersAfterIntercept: ['a=1; Path=/'],
      })).toEqual([set({ name: 'a', value: '1', url: REQUEST_URL, path: '/', secure: false, httpOnly: false })])
    })

    // Chrome holds the origin's last value, a=2, but the handler's last is a=1
    it('writes the handler\'s last value when it only swaps the headers', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'a=2; Path=/'],
        setCookieHeadersAfterIntercept: ['a=2; Path=/', 'a=1; Path=/'],
      })).toEqual([set({ name: 'a', value: '1', url: REQUEST_URL, path: '/', secure: false, httpOnly: false })])
    })

    // on localhost, both headers set the one host-only cookie a=1. The handler
    // still sets it with the header it kept, so nothing is planned: a removal
    // for the dropped header would delete the cookie the handler kept.
    it('keeps the stored cookie when the handler drops one of two headers for it and keeps the other', async () => {
      expect(await plan({
        url: 'http://localhost:3000/',
        setCookieHeadersFromOrigin: ['a=1; Domain=localhost; Path=/', 'a=1; Path=/'],
        setCookieHeadersAfterIntercept: ['a=1; Path=/'],
        chromeCookieStore: [{ name: 'a', value: '1', path: '/', domain: 'localhost' }],
      })).toEqual([])

      expect(await plan({
        url: 'http://localhost:3000/',
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'a=1; Domain=localhost; Path=/'],
        setCookieHeadersAfterIntercept: ['a=1; Domain=localhost; Path=/'],
        chromeCookieStore: [{ name: 'a', value: '1', path: '/', domain: 'localhost' }],
      })).toEqual([])
    })

    // same as above, but Chrome blocked a=2, so it holds the a=1 from this
    // response, which already matches the handler's and needs no write
    it('compares against the last cookie Chrome stored, not one it blocked', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'a=2; Path=/; SameSite=None'],
        setCookieHeadersBlockedByChrome: ['a=2; Path=/; SameSite=None'],
        setCookieHeadersAfterIntercept: ['a=1; Path=/'],
      })).toEqual([])
    })

    // the handler dropped the a=1 Chrome stored and kept only the blocked a=2,
    // which Chrome would block again, so a=1 is removed
    it('removes a stored cookie the handler dropped when only a blocked header for its key remains', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'a=2; Path=/; SameSite=None'],
        setCookieHeadersBlockedByChrome: ['a=2; Path=/; SameSite=None'],
        setCookieHeadersAfterIntercept: ['a=2; Path=/; SameSite=None'],
      })).toEqual([removal({ name: 'a', domain: 'api.example.test', path: '/' })])
    })

    // Chrome would block a=2, so the handler's a=3 wins
    it('writes the last cookie for the key that Chrome would not block', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'a=2; Path=/; SameSite=None'],
        setCookieHeadersBlockedByChrome: ['a=2; Path=/; SameSite=None'],
        setCookieHeadersAfterIntercept: ['a=3; Path=/', 'a=2; Path=/; SameSite=None'],
      })).toEqual([set({ name: 'a', value: '3', url: REQUEST_URL, path: '/', secure: false, httpOnly: false })])
    })
  })

  it('leaves an untouched blocked cookie blocked while syncing another', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['a=1; SameSite=None', 'b=1'],
      setCookieHeadersBlockedByChrome: ['a=1; SameSite=None'],
      setCookieHeadersAfterIntercept: ['a=1; SameSite=None', 'b=2'],
    })).toEqual([set({ name: 'b', value: '2', url: REQUEST_URL, secure: false, httpOnly: false })])
  })

  // the proxy adds and removes __cypress.* cookies for its own use. If they
  // weren't skipped, dropping __cypress.initial would plan a removal and
  // expiring __cypress.unload would plan a write.
  it('plans nothing when only Cypress-internal cookies change', async () => {
    expect(await plan({
      setCookieHeadersFromOrigin: ['__cypress.initial=true; Path=/'],
      setCookieHeadersAfterIntercept: ['__cypress.unload=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'],
    })).toEqual([])
  })

  it('plans nothing for a url it cannot parse', async () => {
    expect(await plan({ url: 'not a url', setCookieHeadersFromOrigin: ['a=1'], setCookieHeadersAfterIntercept: [] })).toEqual([])
  })

  describe('partitioned cookies', () => {
    it('sets a rewritten partitioned cookie into its partition', async () => {
      expect(await plan({
        partitionKey,
        setCookieHeadersFromOrigin: ['a=1; Path=/; Secure; SameSite=None; Partitioned'],
        setCookieHeadersAfterIntercept: ['a=2; Path=/; Secure; SameSite=None; Partitioned'],
      })).toEqual([set({
        name: 'a',
        value: '2',
        url: REQUEST_URL,
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'None',
        partitionKey,
      })])
    })

    it('removes the partitioned original when a rewrite drops Partitioned', async () => {
      expect(await plan({
        partitionKey,
        setCookieHeadersFromOrigin: ['a=1; Path=/; Secure; SameSite=None; Partitioned'],
        setCookieHeadersAfterIntercept: ['a=2; Path=/; Secure; SameSite=None'],
      })).toEqual([
        // drop the partitioned cookie stored by the origin
        removal({ name: 'a', domain: 'api.example.test', path: '/', partitionKey }),
        // set the unpartitioned cookie the handler wrote
        set({ name: 'a', value: '2', url: REQUEST_URL, path: '/', secure: true, httpOnly: false, sameSite: 'None' }),
      ])
    })

    it('removes the unpartitioned original when a rewrite adds Partitioned', async () => {
      const [first, second] = await plan({
        partitionKey,
        setCookieHeadersFromOrigin: ['a=1; Path=/; Secure; SameSite=None'],
        setCookieHeadersAfterIntercept: ['a=2; Path=/; Secure; SameSite=None; Partitioned'],
      })

      // drop the unpartitioned cookie stored by the origin
      expect(first).toEqual(removal({ name: 'a', domain: 'api.example.test', path: '/' }))
      // set the partitioned cookie the handler wrote
      expect(second).toEqual(set({ name: 'a', value: '2', url: REQUEST_URL, path: '/', secure: true, httpOnly: false, sameSite: 'None', partitionKey }))
    })

    // writing it unpartitioned would put it in a different cookie jar
    it('skips partitioned cookies when the partition key is unavailable', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Secure; Partitioned', 'b=1'],
        setCookieHeadersAfterIntercept: ['a=2; Secure; Partitioned', 'b=2'],
      })).toEqual([
        // only the unpartitioned cookie is written
        set({ name: 'b', value: '2', url: REQUEST_URL, secure: false, httpOnly: false }),
      ])
    })
  })

  // when a request is sent without credentials, Chrome stores none of the
  // response's cookies, but extraInfo still reports the headers as unblocked.
  // The only sign is that Chrome's store doesn't hold the origin's values.
  describe('when Chrome did not store the origin\'s cookies', () => {
    const chromeCookieStore: ChromeStoreCookie[] = [{ name: 'session', value: 'loggedin', path: '/', domain: 'api.example.test' }]

    it('does not write the handler\'s cookies', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['session=anon; Path=/'],
        setCookieHeadersAfterIntercept: ['session=anon; Path=/; SameSite=None; Secure', 'added=1; Path=/'],
        chromeCookieStore,
      })).toEqual([])
    })

    // Chrome holds a=other, not the origin's a=1, so that's an older cookie this
    // response never stored and the proxy path would keep it. b=1 matches, so it
    // came from this response and is removed.
    it('removes only the cookies Chrome holds with the origin\'s value', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'b=1; Path=/'],
        setCookieHeadersAfterIntercept: [],
        chromeCookieStore: [
          { name: 'a', value: 'other', path: '/', domain: 'api.example.test' },
          { name: 'b', value: '1', path: '/', domain: 'api.example.test' },
        ],
      })).toEqual([removal({ name: 'b', domain: 'api.example.test', path: '/' })])
    })

    // Chrome never stores an expired cookie, so its absence from the store
    // can't mean the request was sent without credentials
    it('ignores the origin\'s expired cookies when checking whether the request had credentials', async () => {
      // the store is empty either way, so the handler's added cookie is
      // written; `gone` is unchanged and needs no write
      expect(await plan({
        setCookieHeadersFromOrigin: ['gone=; Path=/; Max-Age=0'],
        setCookieHeadersAfterIntercept: ['gone=; Path=/; Max-Age=0', 'added=1; Path=/'],
        chromeCookieStore: [],
      })).toEqual([
        set({ name: 'added', value: '1', url: REQUEST_URL, path: '/', secure: false, httpOnly: false }),
      ])

      // Chrome would have stored the unexpired `gone=1`, so an empty store
      // means no credentials, and the browser would have ignored the
      // handler's cookies too
      expect(await plan({
        setCookieHeadersFromOrigin: ['gone=1; Path=/'],
        setCookieHeadersAfterIntercept: ['gone=1; Path=/', 'added=1; Path=/'],
        chromeCookieStore: [],
      })).toEqual([])
    })

    // without the partition key, the partitioned origin cookie can't be looked
    // up in the store. So an empty store doesn't prove the request was sent
    // without credentials, and the write goes ahead.
    it('writes the handler\'s cookies when the origin only set partitioned cookies and the partition key is unavailable', async () => {
      expect(await plan({
        setCookieHeadersFromOrigin: ['a=1; Secure; Partitioned'],
        setCookieHeadersAfterIntercept: ['a=1; Secure; Partitioned', 'b=1'],
        chromeCookieStore: [],
      })).toEqual([set({ name: 'b', value: '1', url: REQUEST_URL, secure: false, httpOnly: false })])
    })
  })

  describe('when the response is fulfilled', () => {
    it('only removes, since Chrome applies the fulfilled headers itself', async () => {
      expect(await plan({
        includeWrites: false,
        setCookieHeadersFromOrigin: ['a=1; Path=/', 'b=1; Path=/'],
        setCookieHeadersAfterIntercept: ['b=2; Path=/', 'c=1'],
      })).toEqual([removal({ name: 'a', domain: 'api.example.test', path: '/' })])
    })
  })

  describe('reading the store', () => {
    const beforeIntercept = (setCookieHeadersFromOrigin: string[]): CookiesBeforeIntercept => {
      return { setCookieHeadersFromOrigin, setCookieHeadersBlockedByChrome: [] }
    }

    it('plans nothing and never reads the store when the handler left set-cookie untouched', async () => {
      const getChromeCookieStore = vi.fn(async (): Promise<ChromeStoreCookie[]> => [])

      const commands = await planSetCookieSync({
        url: REQUEST_URL,
        cookiesWhenRequestSent: [],
        cookiesBeforeIntercept: beforeIntercept(['a=1; Path=/; Secure; SameSite=None', 'b=2']),
        setCookieHeadersAfterIntercept: ['a=1; Path=/; Secure; SameSite=None', 'b=2'],
        includeWrites: true,
        getChromeCookieStore,
      })

      expect(commands).toEqual([])
      expect(getChromeCookieStore).not.toHaveBeenCalled()
    })

    it('plans nothing and never reads the store when the handler only reordered different cookies', async () => {
      const getChromeCookieStore = vi.fn(async (): Promise<ChromeStoreCookie[]> => [])

      const commands = await planSetCookieSync({
        url: REQUEST_URL,
        cookiesWhenRequestSent: [],
        cookiesBeforeIntercept: beforeIntercept(['a=1', 'b=2']),
        setCookieHeadersAfterIntercept: ['b=2', 'a=1'],
        includeWrites: true,
        getChromeCookieStore,
      })

      expect(commands).toEqual([])
      expect(getChromeCookieStore).not.toHaveBeenCalled()
    })

    // an already-expired header only deletes a cookie and never stores one, so
    // the header alone shows what to put back, without checking the store
    it('restores the held cookie an already-expired origin header deleted, without reading the store', async () => {
      const getChromeCookieStore = vi.fn(async (): Promise<ChromeStoreCookie[]> => [])
      const sentCookie = cookieWhenRequestSent({ value: 'before' })

      const commands = await planSetCookieSync({
        url: REQUEST_URL,
        cookiesWhenRequestSent: [sentCookie],
        cookiesBeforeIntercept: beforeIntercept(['a=; Path=/; Max-Age=0']),
        setCookieHeadersAfterIntercept: [],
        includeWrites: true,
        getChromeCookieStore,
      })

      expect(commands).toEqual([set({
        name: 'a',
        value: 'before',
        domain: 'api.example.test',
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'None',
        priority: 'Medium',
        sourceScheme: 'Secure',
        sourcePort: 443,
        expires: sentCookie.expires,
      })])

      expect(getChromeCookieStore).not.toHaveBeenCalled()
    })

    // b=1 is unchanged, and the dropped a=1 is partitioned with no partition
    // key to address it, so it is skipped
    it('never reads the store when every change is to a cookie it skips', async () => {
      const getChromeCookieStore = vi.fn(async (): Promise<ChromeStoreCookie[]> => [])

      const commands = await planSetCookieSync({
        url: REQUEST_URL,
        cookiesWhenRequestSent: [],
        cookiesBeforeIntercept: beforeIntercept(['a=1; Secure; Partitioned', 'b=1']),
        setCookieHeadersAfterIntercept: ['b=1'],
        includeWrites: true,
        getChromeCookieStore,
      })

      expect(commands).toEqual([])
      expect(getChromeCookieStore).not.toHaveBeenCalled()
    })

    it('reads the store once even when several cookies need confirming', async () => {
      const getChromeCookieStore = vi.fn(async (): Promise<ChromeStoreCookie[]> => {
        return [
          { name: 'a', value: '1', path: '/', domain: 'api.example.test' },
          { name: 'b', value: '1', path: '/', domain: 'api.example.test' },
        ]
      })

      const commands = await planSetCookieSync({
        url: REQUEST_URL,
        cookiesWhenRequestSent: [],
        cookiesBeforeIntercept: beforeIntercept(['a=1; Path=/', 'b=1; Path=/']),
        setCookieHeadersAfterIntercept: [],
        includeWrites: true,
        getChromeCookieStore,
      })

      expect(commands).toHaveLength(2)
      expect(getChromeCookieStore).toHaveBeenCalledOnce()
    })
  })
})
