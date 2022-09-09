import { expect } from 'chai'
import { getSameSiteContext } from '../../../../lib/http/util/cookies'

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
