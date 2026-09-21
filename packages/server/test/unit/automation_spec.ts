import '../spec_helper'
import _ from 'lodash'
import { Automation } from '../../lib/automation'
import { cookieJar } from '../../lib/automation/cookie/jar'

describe('lib/automation', () => {
  beforeEach(function () {
    // @ts-expect-error
    this.automation = new Automation({})
  })

  describe('.reset', () => {
    it('resets middleware', function () {
      const m = this.automation.getMiddleware()

      // all props are null by default
      expect(_.omitBy(m, _.isNull)).to.deep.eq({})

      const onRequest = function () {}
      const onPush = function () {}

      this.automation.use({ onRequest, onPush })

      expect(this.automation.getMiddleware().onRequest).to.eq(onRequest)
      expect(this.automation.getMiddleware().onPush).to.eq(onPush)

      this.automation.reset()

      expect(this.automation.getMiddleware().onRequest).to.be.null

      // keep around onPush
      expect(this.automation.getMiddleware().onPush).to.eq(onPush)
    })
  })

  describe('.response', () => {
    it('deletes the pending request from the requests map after responding', function () {
      let capturedId

      const fn = (_message, _data, id) => {
        capturedId = id
      }

      const promise = this.automation.requestAutomationResponse('take:screenshot', {}, fn)

      // the pending request is tracked while awaiting the browser's response
      expect(this.automation.getRequests()).to.have.property(capturedId)

      this.automation.response(capturedId, { response: 'foo' })

      // once responded to, the request (and anything it retains, e.g. a large
      // screenshot data URL) must be released to avoid a memory leak
      expect(this.automation.getRequests()).to.not.have.property(capturedId)

      return promise.then((resp) => {
        expect(resp).to.eq('foo')
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

    it('replaces a stale jar cookie with the value the browser now holds', function () {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return this.automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        expect(jarCookies()).to.deep.eq(['sid=auth'])
      })
    })

    it('refreshes a tracked cookie without seeding one the jar never held', function () {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return this.automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        return this.automation.normalize('set:cookie', { ...sessionCookie('fresh'), name: 'untracked' }, acceptCookie)
      })
      .then(() => {
        expect(jarCookies()).to.deep.eq(['sid=auth'])
      })
    })

    it('refreshes a Secure cookie the jar tracks when the new one is not Secure', function () {
      cookieJar.setCookie('sid=anon; Path=/; Secure; SameSite=Lax', 'https://localhost/', undefined)

      return this.automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        expect(jarCookies()).to.deep.eq(['sid=auth'])
      })
    })

    it('drops the synced cookie from the jar once it expires', function () {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      const expired = { ...sessionCookie('auth'), expiry: Math.floor(Date.now() / 1000) - 1 }

      return this.automation.normalize('set:cookie', expired, acceptCookie)
      .then(() => {
        expect(jarCookies()).to.deep.eq([])
      })
    })

    it('defaults an unspecified SameSite to lax, the way a browser does', function () {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      const noSameSite = { ...sessionCookie('auth'), sameSite: undefined }

      return this.automation.normalize('set:cookie', noSameSite, acceptCookie)
      .then(() => {
        expect(jarCookies('strict')).to.deep.eq(['sid=auth'])
        expect(jarCookies('none')).to.deep.eq([])
      })
    })

    it('keeps the synced value when a later cookie is rejected by the browser', function () {
      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return this.automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        return this.automation.normalize('set:cookie', sessionCookie('rejected'), () => {
          return Promise.reject(new Error('the browser refused to set the cookie'))
        })
      })
      .then(() => {
        throw new Error('expected set:cookie to reject')
      }, () => {
        expect(jarCookies()).to.deep.eq(['sid=auth'])
      })
    })

    it('keeps the synced value and resolves when a later cookie cannot be stored', function () {
      // a domain the jar cannot build a URL from must not fail the automation,
      // which has already succeeded against the browser by this point
      const unstorable = { ...sessionCookie('manual'), domain: 'not a domain' }

      cookieJar.setCookie('sid=anon; Path=/; SameSite=Lax', url, undefined)

      return this.automation.normalize('set:cookie', sessionCookie('auth'), acceptCookie)
      .then(() => {
        return this.automation.normalize('set:cookie', unstorable, acceptCookie)
      })
      .then((automationCookie) => {
        expect(automationCookie.value).to.eq('manual')
        expect(jarCookies()).to.deep.eq(['sid=auth'])
      })
    })
  })
})
