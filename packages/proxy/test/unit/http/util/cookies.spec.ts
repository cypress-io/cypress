import { expect } from 'chai'
import { calculateSiteContext, getSameSiteContext, shouldAttachAndSetCookies } from '../../../../lib/http/util/cookies'

context('getSameSiteContext', () => {
  describe('calculates the same site context correctly for', () => {
    beforeEach(function () {
      this.isNone = (autUrl, requestUrl, isAUTFrameRequest = false) => {
        expect(getSameSiteContext(autUrl, requestUrl, isAUTFrameRequest)).to.equal('none')
      }

      this.isStrict = (autUrl, requestUrl, isAUTFrameRequest = false) => {
        expect(getSameSiteContext(autUrl, requestUrl, isAUTFrameRequest)).to.equal('strict')
      }

      this.isLax = (autUrl, requestUrl, isAUTFrameRequest = true) => {
        expect(getSameSiteContext(autUrl, requestUrl, isAUTFrameRequest)).to.equal('lax')
      }
    })

    describe('domain + subdomain', () => {
      beforeEach(function () {
        this.autUrl = 'https://staging.google.com'
      })

      it('sameSiteContext=none', function () {
        this.isNone(this.autUrl, 'https://foo.bar:443')
        this.isNone(this.autUrl, 'http://foo.bar')
        this.isNone(this.autUrl, 'http://staging.google.com')
        this.isNone(this.autUrl, 'http://staging.google.com:80')
        this.isNone(this.autUrl, 'https://staging.google2.com:443')
        this.isNone(this.autUrl, 'https://staging.google.net:443')
        this.isNone(this.autUrl, 'https://google.net:443')
        this.isNone(this.autUrl, 'http://google.com')
      })

      it('sameSiteContext=lax', function () {
        this.isLax(this.autUrl, 'https://foo.bar:443')
        this.isLax(this.autUrl, 'http://foo.bar')
        this.isLax(this.autUrl, 'http://staging.google.com')
        this.isLax(this.autUrl, 'http://staging.google.com:80')
        this.isLax(this.autUrl, 'https://staging.google2.com:443')
        this.isLax(this.autUrl, 'https://staging.google.net:443')
        this.isLax(this.autUrl, 'https://google.net:443')
        this.isLax(this.autUrl, 'http://google.com')
      })

      it('sameSiteContext=strict', function () {
        this.isStrict(this.autUrl, 'https://staging.google.com:443')
        this.isStrict(this.autUrl, 'https://google.com:443')
        this.isStrict(this.autUrl, 'https://foo.google.com:443')
        this.isStrict(this.autUrl, 'https://foo.bar.google.com:443')
      })
    })

    describe('public suffix', () => {
      beforeEach(function () {
        this.autUrl = 'https://example.gitlab.io'
      })

      it('sameSiteContext=none', function () {
        this.isNone(this.autUrl, 'http://example.gitlab.io')
        this.isNone(this.autUrl, 'https://foo.gitlab.io:443')
      })

      it('sameSiteContext=lax', function () {
        this.isLax(this.autUrl, 'http://example.gitlab.io')
        this.isLax(this.autUrl, 'https://foo.gitlab.io:443')
      })

      it('sameSiteContext=strict', function () {
        this.isStrict(this.autUrl, 'https://example.gitlab.io:443')
        this.isStrict(this.autUrl, 'https://foo.example.gitlab.io:443')
      })
    })

    describe('localhost', () => {
      beforeEach(function () {
        this.autUrl = 'http://localhost:4200'
      })

      it('sameSiteContext=none', function () {
        this.isNone(this.autUrl, 'http://localhoss:4200')
        this.isNone(this.autUrl, 'https://localhost')
      })

      it('sameSiteContext=lax', function () {
        this.isLax(this.autUrl, 'http://localhoss:4200')
      })

      it('sameSiteContext=strict', function () {
        this.isStrict(this.autUrl, 'http://localhost:4200')
        this.isStrict(this.autUrl, 'http://localhost:4201')
      })
    })

    describe('app.localhost', () => {
      beforeEach(function () {
        this.autUrl = 'http://app.localhost:4200'
      })

      it('sameSiteContext=none', function () {
        this.isNone(this.autUrl, 'http://app.localhoss:4200')
        // app2 is considered a domain and localhost a TLD
        // not app2 being a subdomain and localhost being a domain. Therefore, this should be "none"
        this.isNone(this.autUrl, 'http://app2.localhost:4202')
        // localhost is considered a TLD
        this.isNone(this.autUrl, 'http://localhost:4201')
      })

      it('sameSiteContext=lax', function () {
        this.isLax(this.autUrl, 'http://app.localhoss:4200')
      })

      it('sameSiteContext=strict', function () {
        this.isStrict(this.autUrl, 'http://app.localhost:4200')
        this.isStrict(this.autUrl, 'http://name.app.localhost:4200')
        this.isStrict(this.autUrl, 'http://app.localhost:4201')
      })
    })

    describe('local', () => {
      beforeEach(function () {
        this.autUrl = 'http://brian.dev.local'
      })

      it('sameSiteContext=none', function () {
        this.isNone(this.autUrl, 'https://brian.dev.local:443')
        this.isNone(this.autUrl, 'https://brian.dev.local')
        this.isNone(this.autUrl, 'http://brian.dev2.local:81')
      })

      it('sameSiteContext=lax', function () {
        this.isLax(this.autUrl, 'https://brian.dev.local:443')
        this.isLax(this.autUrl, 'https://brian.dev.local')
        this.isLax(this.autUrl, 'http://brian.dev2.local:81')
      })

      it('sameSiteContext=strict', function () {
        this.isStrict(this.autUrl, 'http://jennifer.dev.local:80')
        this.isStrict(this.autUrl, 'http://jennifer.dev.local')
        this.isStrict(this.autUrl, 'http://jennifer.dev.local:8080')
      })
    })

    describe('ip address', () => {
      beforeEach(function () {
        this.autUrl = 'http://192.168.5.10'
      })

      it('sameSiteContext=none', function () {
        this.isNone(this.autUrl, 'http://192.168.5.10:443')
        this.isNone(this.autUrl, 'https://192.168.5.10')
        this.isNone(this.autUrl, 'http://193.168.5.10')
        this.isNone(this.autUrl, 'http://193.168.5.10:80')
      })

      it('sameSiteContext=lax', function () {
        this.isLax(this.autUrl, 'http://192.168.5.10:443')
        this.isLax(this.autUrl, 'https://192.168.5.10')
        this.isLax(this.autUrl, 'http://193.168.5.10')
        this.isLax(this.autUrl, 'http://193.168.5.10:80')
      })

      it('sameSiteContext=strict', function () {
        this.isStrict(this.autUrl, 'http://192.168.5.10')
        this.isStrict(this.autUrl, 'http://192.168.5.10:80')
        this.isStrict(this.autUrl, 'http://192.168.5.10:8081')
      })
    })
  })
})

context('shouldAttachAndSetCookies', () => {
  const autUrl = 'http://localhost:8080'

  context('fetch', () => {
    it('returns false if credentials are set to omit, regardless of site context', () => {
      // same-origin
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'fetch', 'omit')).to.be.false
      // same-site
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch', 'omit')).to.be.false
      // cross-site
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'fetch', 'omit')).to.be.false
    })

    it('returns true if credentials are set to "include", regardless of site context', () => {
      // same-origin
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'fetch', 'include')).to.be.true
      // same-site
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch', 'include')).to.be.true
      // cross-site
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'fetch', 'include')).to.be.true
    })

    it('returns true if credentials are set to "same-origin" and the site context is "same-origin"', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'fetch', 'same-origin')).to.be.true
    })

    it('returns false if credentials are set to "same-origin" (default), but the site context is "same-site"', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch', 'same-origin')).to.be.false
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'fetch')).to.be.false
    })

    it('returns false if credentials are set to "same-origin" (default), but the site context is "cross-site"', () => {
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'fetch', 'same-origin')).to.be.false
    })
  })

  context('xhr', () => {
    it('returns true if credentials are set to true, regardless of site context', () => {
      // same-origin
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'xhr', true)).to.be.true
      // same-site
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'xhr', true)).to.be.true
      // cross-site
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'xhr', true)).to.be.true
    })

    it('returns true if the site context is same-origin, regardless of credential level', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'xhr', true)).to.be.true
      expect(shouldAttachAndSetCookies('http://localhost:8080/test-request', autUrl, 'xhr', false)).to.be.true
    })

    it('returns false if site context is same-site and "withCredentials" is set to false', () => {
      expect(shouldAttachAndSetCookies('http://localhost:8081/test-request', autUrl, 'xhr', false)).to.be.false
    })

    it('returns false if site context is cross-site and "withCredentials" is set to false', () => {
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/test-request', autUrl, 'xhr', false)).to.be.false
    })
  })

  context('misc', () => {
    it('returns true if the resource type is unknown, but the request comes from the aut frame (could be a navigation request to set top level cookies)', () => {
      // possibly a navigation request for a document or another resource. If this is the case, attach cookies based on the siteContext and cookies should be attached regardless
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/index.html', autUrl, undefined, undefined, true)).to.be.true
    })

    it('returns true if the resource type is unknown, but the request is same-origin', () => {
      // possibly a navigation request for a document or another resource. If this is the case, attach cookies based on the siteContext and cookies should be attached regardless
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/index.html', 'http://www.foobar.com:3500/index.html')).to.be.true
    })

    it('returns false if the resource type is unknown and the request does NOT come from the AUTFrame', () => {
      // possibly a navigation request for a document or another resource. If this is the case, attach cookies based on the siteContext and cookies should be attached regardless
      expect(shouldAttachAndSetCookies('http://www.foobar.com:3500/index.html', autUrl)).to.be.false
    })
  })
})

context('.calculateSiteContext', () => {
  const autUrl = 'https://staging.google.com'

  it('calculates same-origin correctly for same-origin / same-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://staging.google.com')).to.equal('same-origin')
  })

  it('calculates same-site correctly for cross-origin / same-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://app.google.com')).to.equal('same-site')
  })

  it('calculates cross-site correctly for cross-origin / cross-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://staging.google2.com')).to.equal('cross-site')
  })
})
