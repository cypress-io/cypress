import { beforeEach, describe, expect, it, vi } from 'vitest'
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

    it('a cookie for another host', () => expectIgnored('foo=bar; Domain=other.example.com'))

    it('a cookie for a child of the page host', () => expectIgnored('foo=bar; Domain=app.www.foobar.com'))

    it('a cookie for a public suffix', () => expectIgnored('foo=bar; Domain=com'))

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

    it('a cookie that would replace an HttpOnly cookie in the server-side jar', async () => {
      cookieJar.setCookie('foo=bar; Path=/; HttpOnly', 'https://www.foobar.com/', 'strict')

      await write('foo=baz')

      expect(automation.setCookie).not.toHaveBeenCalled()
      expect(cookieJar.getCookies('https://www.foobar.com/').map(({ value, httpOnly }) => ({ value, httpOnly }))).toEqual([{ value: 'bar', httpOnly: true }])
    })

    it('a cookie from an http page that would shadow a Secure cookie', async () => {
      existing = [{ name: 'foo', domain: 'foobar.com', path: '/', httpOnly: false, secure: true }]

      await expectIgnored('foo=baz; Path=/account', 'http://www.foobar.com/')
    })
  })

  it('writes when the existing cookie lookup fails', async () => {
    automation.getCookies.mockRejectedValue(new Error('no automation client'))

    await write('foo=bar')

    expect(automation.setCookie).toHaveBeenCalledOnce()
  })
})
