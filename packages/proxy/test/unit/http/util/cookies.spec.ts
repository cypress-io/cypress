import { describe, expect, it } from 'vitest'
import { calculateSiteContext, getSameSiteContext, shouldAttachAndSetCookies } from '../../../../lib/http/util/cookies'

describe('getSameSiteContext', () => {
  describe('calculates the same site context correctly for', () => {
    const isNone = (autUrl: string, requestUrl: string, isAUTFrameRequest: boolean = false) => {
      expect(getSameSiteContext(autUrl, requestUrl, isAUTFrameRequest)).toEqual('none')
    }
    const isStrict = (autUrl: string, requestUrl: string, isAUTFrameRequest: boolean = false) => {
      expect(getSameSiteContext(autUrl, requestUrl, isAUTFrameRequest)).toEqual('strict')
    }
    const isLax = (autUrl: string, requestUrl: string, isAUTFrameRequest: boolean = true) => {
      expect(getSameSiteContext(autUrl, requestUrl, isAUTFrameRequest)).toEqual('lax')
    }

    describe('domain + subdomain', () => {
      const autUrl = 'https://staging.google.com'

      it('sameSiteContext=none', function () {
        isNone(autUrl, 'https://foo.bar:443')
        isNone(autUrl, 'http://foo.bar')
        isNone(autUrl, 'http://staging.google.com')
        isNone(autUrl, 'http://staging.google.com:80')
        isNone(autUrl, 'https://staging.google2.com:443')
        isNone(autUrl, 'https://staging.google.net:443')
        isNone(autUrl, 'https://google.net:443')
        isNone(autUrl, 'http://google.com')
      })

      it('sameSiteContext=lax', function () {
        isLax(autUrl, 'https://foo.bar:443')
        isLax(autUrl, 'http://foo.bar')
        isLax(autUrl, 'http://staging.google.com')
        isLax(autUrl, 'http://staging.google.com:80')
        isLax(autUrl, 'https://staging.google2.com:443')
        isLax(autUrl, 'https://staging.google.net:443')
        isLax(autUrl, 'https://google.net:443')
        isLax(autUrl, 'http://google.com')
      })

      it('sameSiteContext=strict', function () {
        isStrict(autUrl, 'https://staging.google.com:443')
        isStrict(autUrl, 'https://google.com:443')
        isStrict(autUrl, 'https://foo.google.com:443')
        isStrict(autUrl, 'https://foo.bar.google.com:443')
      })
    })

    describe('public suffix', () => {
      const autUrl = 'https://example.gitlab.io'

      it('sameSiteContext=none', function () {
        isNone(autUrl, 'http://example.gitlab.io')
        isNone(autUrl, 'https://foo.gitlab.io:443')
      })

      it('sameSiteContext=lax', function () {
        isLax(autUrl, 'http://example.gitlab.io')
        isLax(autUrl, 'https://foo.gitlab.io:443')
      })

      it('sameSiteContext=strict', function () {
        isStrict(autUrl, 'https://example.gitlab.io:443')
        isStrict(autUrl, 'https://foo.example.gitlab.io:443')
      })
    })

    describe('localhost', () => {
      const autUrl = 'http://localhost:4200'

      it('sameSiteContext=none', function () {
        isNone(autUrl, 'http://localhoss:4200')
        isNone(autUrl, 'https://localhost')
      })

      it('sameSiteContext=lax', function () {
        isLax(autUrl, 'http://localhoss:4200')
      })

      it('sameSiteContext=strict', function () {
        isStrict(autUrl, 'http://localhost:4200')
        isStrict(autUrl, 'http://localhost:4201')
      })
    })

    describe('app.localhost', () => {
      const autUrl = 'http://app.localhost:4200'

      it('sameSiteContext=none', function () {
        isNone(autUrl, 'http://app.localhoss:4200')
        // app2 is considered a domain and localhost a TLD
        // not app2 being a subdomain and localhost being a domain. Therefore, this should be "none"
        isNone(autUrl, 'http://app2.localhost:4202')
        // localhost is considered a TLD
        isNone(autUrl, 'http://localhost:4201')
      })

      it('sameSiteContext=lax', function () {
        isLax(autUrl, 'http://app.localhoss:4200')
      })

      it('sameSiteContext=strict', function () {
        isStrict(autUrl, 'http://app.localhost:4200')
        isStrict(autUrl, 'http://name.app.localhost:4200')
        isStrict(autUrl, 'http://app.localhost:4201')
      })
    })

    describe('local', () => {
      const autUrl = 'http://brian.dev.local'

      it('sameSiteContext=none', function () {
        isNone(autUrl, 'https://brian.dev.local:443')
        isNone(autUrl, 'https://brian.dev.local')
        isNone(autUrl, 'http://brian.dev2.local:81')
      })

      it('sameSiteContext=lax', function () {
        isLax(autUrl, 'https://brian.dev.local:443')
        isLax(autUrl, 'https://brian.dev.local')
        isLax(autUrl, 'http://brian.dev2.local:81')
      })

      it('sameSiteContext=strict', function () {
        isStrict(autUrl, 'http://jennifer.dev.local:80')
        isStrict(autUrl, 'http://jennifer.dev.local')
        isStrict(autUrl, 'http://jennifer.dev.local:8080')
      })
    })

    describe('ip address', () => {
      const autUrl = 'http://192.168.5.10'

      it('sameSiteContext=none', function () {
        isNone(autUrl, 'http://192.168.5.10:443')
        isNone(autUrl, 'https://192.168.5.10')
        isNone(autUrl, 'http://193.168.5.10')
        isNone(autUrl, 'http://193.168.5.10:80')
      })

      it('sameSiteContext=lax', function () {
        isLax(autUrl, 'http://192.168.5.10:443')
        isLax(autUrl, 'https://192.168.5.10')
        isLax(autUrl, 'http://193.168.5.10')
        isLax(autUrl, 'http://193.168.5.10:80')
      })

      it('sameSiteContext=strict', function () {
        isStrict(autUrl, 'http://192.168.5.10')
        isStrict(autUrl, 'http://192.168.5.10:80')
        isStrict(autUrl, 'http://192.168.5.10:8081')
      })
    })
  })
})

describe('shouldAttachAndSetCookies', () => {
  const autUrl = 'http://localhost:8080'

  describe('fetch', () => {
    it('returns false if credentials are set to omit, regardless of site context', () => {
      // same-origin
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'fetch', 'omit')).toBe(false)
      // same-site
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch', 'omit')).toBe(false)
      // cross-site
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'fetch', 'omit')).toBe(false)
    })

    it('returns true if credentials are set to "include", regardless of site context', () => {
      // same-origin
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'fetch', 'include')).toBe(true)
      // same-site
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch', 'include')).toBe(true)
      // cross-site
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'fetch', 'include')).toBe(true)
    })

    it('returns true if credentials are set to "same-origin" and the site context is "same-origin"', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'fetch', 'same-origin')).toBe(true)
    })

    it('returns false if credentials are set to "same-origin" (default), but the site context is "same-site"', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch', 'same-origin')).toBe(false)
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch')).toBe(false)
    })

    it('returns false if credentials are set to "same-origin" (default), but the site context is "cross-site"', () => {
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'fetch', 'same-origin')).toBe(false)
    })
  })

  describe('xhr', () => {
    it('returns true if credentials are set to true, regardless of site context', () => {
      // same-origin
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'xhr', true)).toBe(true)
      // same-site
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'xhr', true)).toBe(true)
      // cross-site
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'xhr', true)).toBe(true)
    })

    it('returns true if the site context is same-origin, regardless of credential level', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'xhr', true)).toBe(true)
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'xhr', false)).toBe(true)
    })

    it('returns false if site context is same-site and "withCredentials" is set to false', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'xhr', false)).toBe(false)
    })

    it('returns false if site context is cross-site and "withCredentials" is set to false', () => {
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'xhr', false)).toBe(false)
    })
  })

  describe('misc', () => {
    it('returns true if the resource type is unknown, but the request comes from the aut frame (could be a navigation request to set top level cookies)', () => {
      // possibly a navigation request for a document or another resource. If this is the case, attach cookies based on the siteContext and cookies should be attached regardless
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/index.html', autUrl, undefined, undefined, true)).toBe(true)
    })

    it('returns true if the resource type is unknown, but the request is same-origin', () => {
      // possibly a navigation request for a document or another resource. If this is the case, attach cookies based on the siteContext and cookies should be attached regardless
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/index.html', 'http://www.foobar.com:3500/index.html')).toBe(true)
    })

    it('returns false if the resource type is unknown and the request does NOT come from the AUTFrame', () => {
      // possibly a navigation request for a document or another resource. If this is the case, attach cookies based on the siteContext and cookies should be attached regardless
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/index.html', autUrl)).toBe(false)
    })
  })
})

describe('.calculateSiteContext', () => {
  const autUrl = 'https://staging.google.com'

  it('calculates same-origin correctly for same-origin / same-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://staging.google.com')).toEqual('same-origin')
  })

  it('calculates same-site correctly for cross-origin / same-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://app.google.com')).toEqual('same-site')
  })

  it('calculates cross-site correctly for cross-origin / cross-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://staging.google2.com')).toEqual('cross-site')
  })
})
