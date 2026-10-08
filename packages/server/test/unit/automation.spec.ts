import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import _ from 'lodash'
import { Automation } from '../../lib/automation'
import { cookieJar } from '../../lib/automation/cookie/jar'

describe('lib/automation', () => {
  let automation

  beforeEach(() => {
    // @ts-expect-error
    automation = new Automation({})
  })

  describe('.reset', () => {
    it('resets middleware', () => {
      const m = automation.getMiddleware()

      // all props are null by default
      expect(_.omitBy(m, _.isNull)).toStrictEqual({})

      const onRequest = function () {}
      const onPush = function () {}

      automation.use({ onRequest, onPush })

      expect(automation.getMiddleware().onRequest).toBe(onRequest)
      expect(automation.getMiddleware().onPush).toBe(onPush)

      automation.reset()

      expect(automation.getMiddleware().onRequest).toBeNull()

      // keep around onPush
      expect(automation.getMiddleware().onPush).toBe(onPush)
    })
  })

  describe('.response', () => {
    it('deletes the pending request from the requests map after responding', () => {
      let capturedId

      const fn = (_message, _data, id) => {
        capturedId = id
      }

      const promise = automation.requestAutomationResponse('take:screenshot', {}, fn)

      // the pending request is tracked while awaiting the browser's response
      expect(automation.getRequests()).toHaveProperty(capturedId)

      automation.response(capturedId, { response: 'foo' })

      // once responded to, the request (and anything it retains, e.g. a large
      // screenshot data URL) must be released to avoid a memory leak
      expect(automation.getRequests()).not.toHaveProperty(capturedId)

      return promise.then((resp) => {
        expect(resp).toBe('foo')
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/34891
  describe('.normalize set:cookie', () => {
    const url = 'http://localhost/'

    const sessionCookie = (value: string) => {
      return {
        name: 'sid',
        value,
        domain: 'localhost',
        path: '/',
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        expiry: null,
        maxAge: null,
      }
    }

    const jarCookies = (sameSiteContext?: 'strict' | 'lax' | 'none') => {
      return cookieJar.getCookies(url, sameSiteContext).map((cookie) => `${cookie.key}=${cookie.value}`)
    }

    const acceptCookie = (cookie) => Promise.resolve(cookie)

    beforeEach(() => {
      cookieJar.removeAllCookies()
    })

    afterEach(() => {
      cookieJar.removeAllCookies()
    })

    it('replaces a stale jar cookie with the value the browser now holds', () => {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        expect(jarCookies()).toStrictEqual(['sid=auth'])
      })
    })

    it('refreshes a tracked cookie without seeding one the jar never held', () => {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        return automation.normalize('set:cookie', { ...sessionCookie('fresh'), name: 'untracked' }, acceptCookie)
      })
      .then(() => {
        expect(jarCookies()).toStrictEqual(['sid=auth'])
      })
    })

    it('refreshes a Secure cookie the jar tracks when the new one is not Secure', () => {
      cookieJar.setCookie('sid=anon; Path=/; Secure; SameSite=Lax', 'https://localhost/', undefined)

      return automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        expect(jarCookies()).toStrictEqual(['sid=auth'])
      })
    })

    it('refreshes a cookie whose domain carries a leading dot', () => {
      const domainUrl = 'http://www.example.com/'

      cookieJar.setCookie('sid=anon; Domain=example.com; Path=/; SameSite=Lax', domainUrl, undefined)

      const dotted = { ...sessionCookie('auth'), domain: '.example.com' }

      return automation.normalize('set:cookie', dotted, acceptCookie)
      .then(() => {
        const stored = cookieJar.getCookies(domainUrl).map((cookie) => `${cookie.key}=${cookie.value}`)

        expect(stored).toStrictEqual(['sid=auth'])
      })
    })

    it('drops the synced cookie from the jar once it expires', () => {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      const expired = { ...sessionCookie('auth'), expiry: Math.floor(Date.now() / 1000) - 1 }

      return automation.normalize('set:cookie', expired, acceptCookie)
      .then(() => {
        expect(jarCookies()).toStrictEqual([])
      })
    })

    // `cy.setCookie()` accepts both an omitted sameSite and the extension
    // vocabulary's literal 'unspecified'; the browser treats each as Lax
    ;[
      { label: 'a missing', sameSite: undefined },
      { label: 'an explicit \'unspecified\'', sameSite: 'unspecified' },
    ].forEach(({ label, sameSite }) => {
      it(`treats ${label} SameSite as lax, the way a browser does`, () => {
        cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

        return automation.normalize('set:cookie', { ...sessionCookie('auth'), sameSite }, acceptCookie)
        .then(() => {
          expect(jarCookies('strict')).toStrictEqual(['sid=auth'])
          expect(jarCookies('none')).toStrictEqual([])
        })
      })
    })

    it('keeps the synced value when a later cookie is rejected by the browser', () => {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        return automation.normalize('set:cookie', sessionCookie('rejected'), () => {
          return Promise.reject(new Error('the browser refused to set the cookie'))
        })
      })
      .then(() => {
        throw new Error('expected set:cookie to reject')
      }, () => {
        expect(jarCookies()).toStrictEqual(['sid=auth'])
      })
    })

    it('keeps the synced value and resolves when a later cookie cannot be stored', () => {
      // a domain the jar cannot build a URL from must not fail the automation,
      // which has already succeeded against the browser by this point
      const unstorable = { ...sessionCookie('manual'), domain: 'not a domain' }

      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        return automation.normalize('set:cookie', unstorable, acceptCookie)
      })
      .then((automationCookie) => {
        expect(automationCookie.value).toBe('manual')
        expect(jarCookies()).toStrictEqual(['sid=auth'])
      })
    })
  })
})
