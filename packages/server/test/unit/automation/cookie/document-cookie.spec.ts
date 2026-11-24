import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setDocumentCookie } from '../../../../lib/automation/cookie/document-cookie'
import type { DocumentCookieAutomation } from '../../../../lib/automation/cookie/document-cookie'
import { cookieJar } from '../../../../lib/automation/cookie/jar'

describe('lib/automation/cookie/document-cookie', () => {
  let existing: Awaited<ReturnType<DocumentCookieAutomation['getCookies']>>
  let automation: { getCookies: ReturnType<typeof vi.fn>, setCookie: ReturnType<typeof vi.fn> }

  const write = (cookieString: unknown, url: unknown = 'https://www.foobar.com/page') => {
    return setDocumentCookie({ cookieString, url }, automation)
  }

  const browserCookie = () => automation.setCookie.mock.calls[0]?.[0]

  beforeEach(() => {
    existing = []
    automation = {
      getCookies: vi.fn(async () => existing),
      setCookie: vi.fn(async () => {}),
    }

    cookieJar.removeAllCookies()
  })

  describe('writes', () => {
    it('a host-only cookie for the page host at /', async () => {
      await write('foo=bar')

      expect(browserCookie()).toMatchObject({ name: 'foo', value: 'bar', domain: 'www.foobar.com', hostOnly: true, path: '/', httpOnly: false, secure: false, sameSite: 'lax' })
      expect(cookieJar.getCookies('https://www.foobar.com/').map(({ key, value }) => ({ key, value }))).toEqual([{ key: 'foo', value: 'bar' }])
    })

    it('a cookie for a parent domain within the registrable domain', async () => {
      await write('foo=bar; Domain=.foobar.com')

      expect(browserCookie()).toMatchObject({ domain: 'foobar.com', hostOnly: false })
    })

    it('a cookie without a Path at the directory of the page', async () => {
      await write('foo=bar', 'https://www.foobar.com/account/settings/page.html')

      expect(browserCookie()).toMatchObject({ path: '/account/settings' })
    })

    it('a cookie with a relative Path at the directory of the page', async () => {
      await write('foo=bar; Path=fixtures', 'https://www.foobar.com/account/settings/page.html')

      expect(browserCookie()).toMatchObject({ path: '/account/settings' })
    })

    it('a cookie without a name', async () => {
      await write('foo')
      await write('=bar=baz')

      expect(automation.setCookie.mock.calls.map(([cookie]) => ({ name: cookie.name, value: cookie.value }))).toEqual([{ name: '', value: 'foo' }, { name: '', value: 'bar=baz' }])
    })

    it('a cookie without an attribute that is over 1024 bytes', async () => {
      await write(`foo=bar; Path=/${'a'.repeat(1024)}; Max-Age=60`, 'https://www.foobar.com/account/page.html')

      expect(browserCookie()).toMatchObject({ path: '/account', maxAge: 60 })
    })

    it('a Domain with no registrable part when it is the page host', async () => {
      await write('foo=bar; Domain=localhost', 'http://localhost:3500/')
      await write('foo=bar; Domain=127.0.0.1', 'http://127.0.0.1:3500/')
      await write('foo=bar; Domain=web', 'http://web:3000/')
      await write('foo=bar; Domain=github.io', 'https://github.io/')

      expect(automation.setCookie.mock.calls.map(([cookie]) => cookie.domain)).toEqual(['localhost', '127.0.0.1', 'web', 'github.io'])
      expect(cookieJar.getAllCookies().map(({ domain }) => domain).sort()).toEqual(['127.0.0.1', 'github.io', 'localhost', 'web'])
    })

    it('a Domain in its canonical form', async () => {
      await write('foo=bar; Domain=[::1]', 'http://[::1]:3500/')
      await write('foo=bar; Domain=WWW.Foobar.com')

      expect(automation.setCookie.mock.calls.map(([cookie]) => cookie.domain)).toEqual(['::1', 'www.foobar.com'])
    })

    it('a parent Domain on a special-use TLD', async () => {
      await write('foo=bar; Domain=app.test', 'http://www.app.test/')
      await write('foo=bar; Domain=app.localhost', 'http://x.app.localhost:3500/')

      expect(automation.setCookie.mock.calls.map(([cookie]) => cookie.domain)).toEqual(['app.test', 'app.localhost'])
    })

    it('a __Host- cookie with Path=/ from a page at /', async () => {
      await write('__Host-foo=bar; Secure; Path=/', 'https://www.foobar.com/')

      expect(browserCookie()).toMatchObject({ name: '__Host-foo', path: '/' })
    })

    it('a Secure cookie from an https page', async () => {
      await write('foo=bar; Secure; SameSite=None')

      expect(browserCookie()).toMatchObject({ secure: true, sameSite: 'no_restriction' })
    })

    it('a Secure cookie from an http localhost page', async () => {
      await write('foo=bar; Secure', 'http://localhost:3500/')

      expect(browserCookie()).toMatchObject({ domain: 'localhost', secure: true })
    })

    it('prefixed cookies that meet their rules', async () => {
      await write('__Secure-foo=bar; Secure; Domain=foobar.com')
      await write('__Host-foo=bar; Secure; Path=/')

      expect(automation.setCookie.mock.calls.map(([cookie]) => cookie.name)).toEqual(['__Secure-foo', '__Host-foo'])
    })

    it('an expired cookie with its Domain so the browser removes it', async () => {
      await write('foo=deleted; Domain=foobar.com; Max-Age=0')

      expect(browserCookie()).toMatchObject({ name: 'foo', domain: 'foobar.com', hostOnly: false })
      expect(browserCookie().expiry * 1000).toBeLessThanOrEqual(Date.now())
    })

    it('over an existing cookie that is neither HttpOnly nor Secure', async () => {
      existing = [{ name: 'foo', domain: 'www.foobar.com', path: '/', httpOnly: false, secure: false }]

      await write('foo=baz', 'http://www.foobar.com/')

      expect(browserCookie()).toMatchObject({ value: 'baz' })
    })
  })

  describe('ignores', () => {
    const expectIgnored = async (cookieString: unknown, url?: unknown) => {
      await write(cookieString, url)

      expect(automation.setCookie).not.toHaveBeenCalled()
      expect(cookieJar.getAllCookies()).toEqual([])
    }

    it('a message without a cookie string', () => expectIgnored(undefined))

    it('a message without a usable url', async () => {
      await expectIgnored('foo=bar', 'not a url')
      await expectIgnored('foo=bar', 'file:///page')
    })

    it('a string that does not parse', () => expectIgnored(''))

    it('a cookie with neither a name nor a value', async () => {
      await expectIgnored('=')
      await expectIgnored('; Path=/')
    })

    it('a name and value over 4096 bytes', () => expectIgnored(`foo=${'a'.repeat(4094)}`))

    it('a cookie without a name whose value has a prefix', () => expectIgnored('=__Host-foo=bar; Secure; Path=/'))

    it('a prefix reserved for cookies set by a response, in any case', async () => {
      await expectIgnored('__Http-foo=bar; Secure')
      await expectIgnored('__host-http-foo=bar; Secure; Path=/')
    })

    it('a __Host- cookie without a Path from a page outside /', () => expectIgnored('__Host-foo=bar; Secure', 'https://www.foobar.com/account/page.html'))

    it('a cookie for another host', () => expectIgnored('foo=bar; Domain=other.example.com'))

    it('a cookie for a child of the page host', () => expectIgnored('foo=bar; Domain=app.www.foobar.com'))

    it('a cookie for a public suffix', () => expectIgnored('foo=bar; Domain=com'))

    it('a Domain with no registrable part that is not the page host', async () => {
      await expectIgnored('foo=bar; Domain=localhost', 'http://app.localhost:3500/')
      await expectIgnored('foo=bar; Domain=test', 'http://www.app.test/')
      await expectIgnored('foo=bar; Domain=web', 'http://api.web:3000/')
      await expectIgnored('foo=bar; Domain=github.io', 'https://user.github.io/')
    })

    it('a string with a control character anywhere in it', async () => {
      await expectIgnored('foo=bar\nbaz=qux')
      await expectIgnored('foo=bar\rbaz')
      await expectIgnored('foo=bar\u0000baz')
      await expectIgnored('=foo\nbar')
      await expectIgnored('foo=bar; Path=/\u0001')
      await expectIgnored('foo=bar; Other=\u007f')
    })

    it('a __Host- cookie without a Path, even from a page at /', () => expectIgnored('__Host-foo=bar; Secure', 'https://www.foobar.com/'))

    it('a cookie for part of an IP address', () => expectIgnored('foo=bar; Domain=0.0.1', 'http://127.0.0.1:3500/'))

    it('an HttpOnly cookie', () => expectIgnored('foo=bar; HttpOnly'))

    it('a Secure cookie from an http page', () => expectIgnored('foo=bar; Secure', 'http://www.foobar.com/'))

    it('a SameSite=None cookie that is not Secure', () => expectIgnored('foo=bar; SameSite=None'))

    it('a __Secure- cookie that is not Secure, in any case', async () => {
      await expectIgnored('__Secure-foo=bar')
      await expectIgnored('__SECURE-foo=bar')
    })

    it('a __Host- cookie for a parent domain, in any case', async () => {
      await expectIgnored('__Host-foo=bar; Secure; Domain=foobar.com')
      await expectIgnored('__host-foo=bar; Secure; Domain=foobar.com')
    })

    it('a __Host- cookie with a path other than /', () => expectIgnored('__Host-foo=bar; Secure; Path=/fixtures'))

    it('a cookie that would replace an HttpOnly cookie in the browser', async () => {
      existing = [{ name: 'foo', domain: '.www.foobar.com', path: '/', httpOnly: true, secure: false }]

      await expectIgnored('foo=baz')
    })

    it('a cookie that would replace an HttpOnly cookie on an IPv6 host', async () => {
      existing = [{ name: 'foo', domain: '[::1]', path: '/', httpOnly: true, secure: false }]

      await expectIgnored('foo=baz', 'http://[::1]:3500/')
    })

    it('a cookie that would replace an HttpOnly cookie in the server-side jar and the browser', async () => {
      cookieJar.setCookie('foo=bar; Path=/; HttpOnly', 'https://www.foobar.com/', 'strict')
      existing = [{ name: 'foo', domain: 'www.foobar.com', path: '/', httpOnly: true, secure: false }]

      await write('foo=baz')

      expect(automation.setCookie).not.toHaveBeenCalled()
      expect(cookieJar.getCookies('https://www.foobar.com/').map(({ value, httpOnly }) => ({ value, httpOnly }))).toEqual([{ value: 'bar', httpOnly: true }])
    })

    it('a cookie from an http page that would shadow a Secure cookie', async () => {
      existing = [{ name: 'foo', domain: 'foobar.com', path: '/', httpOnly: false, secure: true }]

      await expectIgnored('foo=baz; Path=/account', 'http://www.foobar.com/')
    })
  })

  describe('when the browser refuses the cookie', () => {
    beforeEach(() => {
      automation.setCookie.mockRejectedValue(new Error('refused'))
    })

    it('rejects and leaves the server-side jar without it', async () => {
      await expect(write('foo=bar')).rejects.toThrow('refused')

      expect(cookieJar.getAllCookies()).toEqual([])
    })

    it('keeps the cookie it would have replaced', async () => {
      cookieJar.setCookie('foo=bar; Path=/', 'https://www.foobar.com/', 'strict')

      await expect(write('foo=baz; Path=/')).rejects.toThrow('refused')

      expect(cookieJar.getAllCookies().map(({ key, value }) => ({ key, value }))).toEqual([{ key: 'foo', value: 'bar' }])
    })
  })

  describe('while the browser has not answered', () => {
    const jarValues = () => cookieJar.getAllCookies().map(({ key, value }) => ({ key, value }))

    it('holds the cookie in the server-side jar', async () => {
      let answer: (cookies: typeof existing) => void = () => {}

      automation.getCookies.mockReturnValue(new Promise((resolve) => answer = resolve))

      const written = write('foo=bar')

      expect(jarValues()).toEqual([{ key: 'foo', value: 'bar' }])

      answer([])
      await written
    })

    it('takes the cookie back out when an existing cookie blocks the write', async () => {
      cookieJar.setCookie('foo=bar; Path=/', 'https://www.foobar.com/', 'strict')
      existing = [{ name: 'foo', domain: 'www.foobar.com', path: '/', httpOnly: true, secure: false }]

      await write('foo=baz; Path=/')

      expect(jarValues()).toEqual([{ key: 'foo', value: 'bar' }])
    })

    it('leaves a later write to the same cookie in place when the earlier one is refused', async () => {
      let refuse: (err: Error) => void = () => {}

      automation.setCookie.mockReturnValueOnce(new Promise((_resolve, reject) => refuse = reject))

      const earlier = write('foo=bar; Path=/')
      const later = write('foo=baz; Path=/')

      refuse(new Error('refused'))
      await expect(earlier).rejects.toThrow('refused')
      await later

      expect(jarValues()).toEqual([{ key: 'foo', value: 'baz' }])
    })

    it('goes back to the cookie from before both writes when two writes to the same cookie are refused', async () => {
      let refuse: (err: Error) => void = () => {}

      cookieJar.setCookie('foo=old; Path=/', 'https://www.foobar.com/', 'strict')
      automation.setCookie.mockReturnValueOnce(new Promise((_resolve, reject) => refuse = reject))
      automation.setCookie.mockRejectedValueOnce(new Error('refused'))

      const earlier = write('foo=bar; Path=/')
      const later = write('foo=baz; Path=/')

      refuse(new Error('refused'))
      await expect(earlier).rejects.toThrow('refused')
      await expect(later).rejects.toThrow('refused')

      expect(jarValues()).toEqual([{ key: 'foo', value: 'old' }])
    })
  })

  describe('when a cookie in the server-side jar blocks the write', () => {
    const secureRequestCookies = () => cookieJar.getCookies('https://www.foobar.com/').map(({ key, value }) => `${key}=${value}`)

    beforeEach(() => {
      cookieJar.setCookie('foo=bar; Path=/; Secure', 'https://www.foobar.com/', 'strict')
    })

    it('leaves the jar alone until the browser answers', async () => {
      let answer: (cookies: typeof existing) => void = () => {}

      automation.getCookies.mockReturnValue(new Promise((resolve) => answer = resolve))

      const written = write('foo=baz; Path=/', 'http://www.foobar.com/')

      expect(secureRequestCookies()).toEqual(['foo=bar'])

      answer([{ name: 'foo', domain: 'www.foobar.com', path: '/', httpOnly: false, secure: true }])
      await written

      expect(automation.setCookie).not.toHaveBeenCalled()
      expect(secureRequestCookies()).toEqual(['foo=bar'])
    })

    it('sends a later write to the browser after the one that is waiting', async () => {
      let answer: (cookies: typeof existing) => void = () => {}

      automation.getCookies.mockReturnValueOnce(new Promise((resolve) => answer = resolve))

      const held = write('foo=baz; Path=/', 'http://www.foobar.com/')
      const later = write('foo=later; Path=/', 'http://www.foobar.com/')

      answer([])
      await Promise.all([held, later])

      expect(automation.setCookie.mock.calls.map(([cookie]) => cookie.value)).toEqual(['baz', 'later'])
      expect(secureRequestCookies()).toEqual(['foo=later'])
    })

    it('keeps the write the browser took when a later one is refused', async () => {
      automation.setCookie.mockResolvedValueOnce(undefined)
      automation.setCookie.mockRejectedValueOnce(new Error('refused'))

      const held = write('foo=baz; Path=/', 'http://www.foobar.com/')
      const later = write('foo=later; Path=/', 'http://www.foobar.com/')

      await held
      await expect(later).rejects.toThrow('refused')

      expect(secureRequestCookies()).toEqual(['foo=baz'])
    })

    it('drops the write when the jar is cleared before the browser answers', async () => {
      let answer: (cookies: typeof existing) => void = () => {}

      automation.getCookies.mockReturnValueOnce(new Promise((resolve) => answer = resolve))

      const waiting = write('foo=new; Path=/')

      cookieJar.removeAllCookies()
      answer([])
      await waiting

      expect(automation.setCookie).not.toHaveBeenCalled()
      expect(cookieJar.getAllCookies()).toEqual([])
    })

    it('writes once the browser no longer has that cookie', async () => {
      await write('foo=baz; Path=/', 'http://www.foobar.com/')

      expect(browserCookie()).toMatchObject({ name: 'foo', value: 'baz' })
      expect(secureRequestCookies()).toEqual(['foo=baz'])
    })
  })

  it('writes over an HttpOnly cookie in the jar that the browser no longer has', async () => {
    cookieJar.setCookie('foo=bar; Path=/; HttpOnly', 'https://www.foobar.com/', 'strict')

    await write('foo=new; Path=/')

    expect(browserCookie()).toMatchObject({ name: 'foo', value: 'new' })
    expect(cookieJar.getCookies('https://www.foobar.com/').map(({ value, httpOnly }) => ({ value, httpOnly }))).toEqual([{ value: 'new', httpOnly: false }])
  })

  it('keeps the creation time of the cookie it goes back to', async () => {
    cookieJar.setCookie('foo=old; Path=/; Max-Age=60', 'https://www.foobar.com/', 'strict')

    const [{ creation }] = cookieJar.getAllCookies()

    automation.setCookie.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))

      throw new Error('refused')
    })

    await expect(write('foo=new; Path=/')).rejects.toThrow('refused')

    const [restored] = cookieJar.getAllCookies()

    expect(restored.value).toBe('old')
    expect(restored.creation).toEqual(creation)
  })

  it('writes over an expired HttpOnly cookie the browser still returns', async () => {
    existing = [{ name: 'foo', domain: 'www.foobar.com', path: '/', httpOnly: true, expiry: Date.now() / 1000 - 60 }]

    await write('foo=new; Path=/')

    expect(browserCookie()).toMatchObject({ name: 'foo', value: 'new' })
    expect(cookieJar.getAllCookies().map(({ value }) => value)).toEqual(['new'])
  })

  it('does not write over an HttpOnly cookie the browser returns with a later expiry', async () => {
    existing = [{ name: 'foo', domain: 'www.foobar.com', path: '/', httpOnly: true, expiry: Date.now() / 1000 + 60 }]

    await write('foo=new; Path=/')

    expect(automation.setCookie).not.toHaveBeenCalled()
    expect(cookieJar.getAllCookies()).toEqual([])
  })

  it('writes over an expired HttpOnly cookie the jar has not purged', async () => {
    cookieJar.setCookie('foo=; Path=/; HttpOnly; Max-Age=0', 'https://www.foobar.com/', 'strict')

    await write('foo=new; Path=/')

    expect(browserCookie()).toMatchObject({ name: 'foo', value: 'new' })
    expect(cookieJar.getCookies('https://www.foobar.com/').map(({ key, value }) => `${key}=${value}`)).toEqual(['foo=new'])
  })

  it('does not bring back a cookie that was cleared while a refused write was in flight', async () => {
    let refuse: (err: Error) => void = () => {}

    cookieJar.setCookie('foo=old; Path=/', 'https://www.foobar.com/', 'strict')
    automation.setCookie.mockReturnValueOnce(new Promise((_resolve, reject) => refuse = reject))

    const refused = write('foo=new; Path=/')

    await vi.waitFor(() => expect(automation.setCookie).toHaveBeenCalled())
    cookieJar.removeAllCookies()
    refuse(new Error('refused'))
    await expect(refused).rejects.toThrow('refused')

    expect(cookieJar.getAllCookies()).toEqual([])
  })

  describe('an expired cookie the browser refuses', () => {
    const jarValues = () => cookieJar.getCookies('https://www.foobar.com/').map(({ key, value }) => `${key}=${value}`)

    beforeEach(() => {
      cookieJar.setCookie('foo=bar; Path=/', 'https://www.foobar.com/', 'strict')
    })

    it('goes back to the cookie it replaced after the jar has been read', async () => {
      automation.setCookie.mockImplementation(async () => {
        cookieJar.getCookies('https://www.foobar.com/')

        throw new Error('refused')
      })

      await expect(write('foo=; Path=/; Max-Age=0')).rejects.toThrow('refused')

      expect(jarValues()).toEqual(['foo=bar'])
    })

    it('goes back to the cookie it replaced when a later write is refused as well', async () => {
      let refuse: (err: Error) => void = () => {}

      automation.setCookie.mockReturnValueOnce(new Promise((_resolve, reject) => refuse = reject))
      automation.setCookie.mockRejectedValueOnce(new Error('refused'))

      const earlier = write('foo=; Path=/; Max-Age=0')

      cookieJar.getCookies('https://www.foobar.com/')

      const later = write('foo=new; Path=/')

      refuse(new Error('refused'))
      await expect(earlier).rejects.toThrow('refused')
      await expect(later).rejects.toThrow('refused')

      expect(jarValues()).toEqual(['foo=bar'])
    })

    it('leaves a later expired write in charge of the cookie', async () => {
      let refuse: (err: Error) => void = () => {}

      automation.setCookie.mockReturnValueOnce(new Promise((_resolve, reject) => refuse = reject))

      const earlier = write('foo=; Path=/; Max-Age=0')
      const later = write('foo=; Path=/; Max-Age=0')

      cookieJar.getCookies('https://www.foobar.com/')

      refuse(new Error('refused'))
      await expect(earlier).rejects.toThrow('refused')
      await later

      expect(jarValues()).toEqual([])
    })
  })

  describe('when the browser never answers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('sends a later write to the same cookie once the wait is over', async () => {
      automation.getCookies.mockReturnValueOnce(new Promise(() => {}))

      const unanswered = write('foo=bar; Path=/')
      const later = write('foo=baz; Path=/')

      await vi.advanceTimersByTimeAsync(5000)
      await Promise.all([unanswered, later])

      expect(automation.setCookie.mock.calls.map(([cookie]) => cookie.value)).toEqual(['baz'])
      expect(cookieJar.getAllCookies().map(({ value }) => value)).toEqual(['baz'])
    })

    it('does not bring back a cookie that was cleared when a later write is refused', async () => {
      automation.setCookie.mockReturnValueOnce(new Promise(() => {}))
      automation.setCookie.mockRejectedValueOnce(new Error('refused'))

      const unanswered = write('foo=bar; Path=/')

      await vi.advanceTimersByTimeAsync(0)
      cookieJar.removeAllCookies()

      const refused = write('foo=baz; Path=/').catch((err: Error) => err.message)

      await vi.advanceTimersByTimeAsync(5000)
      await unanswered

      expect(await refused).toBe('refused')

      expect(cookieJar.getAllCookies()).toEqual([])
    })

    it('writes over an HttpOnly cookie whose Max-Age has passed without waiting for the browser', async () => {
      cookieJar.setCookie('foo=old; Path=/; HttpOnly; Max-Age=60', 'https://www.foobar.com/', 'strict')
      vi.setSystemTime(Date.now() + 300000)
      automation.getCookies.mockReturnValueOnce(new Promise(() => {}))

      const unanswered = write('foo=new; Path=/')

      expect(cookieJar.getAllCookies().map(({ value }) => value)).toEqual(['new'])

      await vi.advanceTimersByTimeAsync(5000)
      await unanswered
    })

    it('keeps a cookie the browser was told to set', async () => {
      automation.setCookie.mockReturnValueOnce(new Promise(() => {}))

      const unanswered = write('foo=bar; Path=/')

      await vi.advanceTimersByTimeAsync(5000)
      await unanswered

      expect(cookieJar.getAllCookies().map(({ value }) => value)).toEqual(['bar'])
    })
  })

  it('ignores the write when the existing cookie lookup fails', async () => {
    automation.getCookies.mockRejectedValue(new Error('no automation client'))

    await write('foo=bar')

    expect(automation.setCookie).not.toHaveBeenCalled()
    expect(cookieJar.getAllCookies()).toEqual([])
  })
})
