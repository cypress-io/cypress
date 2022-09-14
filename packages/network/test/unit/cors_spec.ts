import { cors } from '../../lib'
import { expect } from 'chai'

describe('lib/cors', () => {
  context('.parseUrlIntoDomainTldPort', () => {
    const expectUrlToBeParsedCorrectly = (url, obj) => {
      expect(cors.parseUrlIntoDomainTldPort(url)).to.deep.eq(obj)
    }

    it('parses https://www.google.com', function () {
      expectUrlToBeParsedCorrectly('https://www.google.com', {
        port: '443',
        domain: 'google',
        tld: 'com',
      })
    })

    it('parses http://localhost:8080', function () {
      expectUrlToBeParsedCorrectly('http://localhost:8080', {
        port: '8080',
        domain: '',
        tld: 'localhost',
      })
    })

    it('parses http://app.localhost:8080', function () {
      expectUrlToBeParsedCorrectly('http://app.localhost:8080', {
        port: '8080',
        domain: 'app',
        tld: 'localhost',
      })
    })

    it('parses http://app.localhost.dev:8080', function () {
      expectUrlToBeParsedCorrectly('http://app.localhost.dev:8080', {
        port: '8080',
        domain: 'localhost',
        tld: 'dev',
      })
    })

    it('parses http://app.local:8080', function () {
      expectUrlToBeParsedCorrectly('http://app.local:8080', {
        port: '8080',
        domain: 'app',
        tld: 'local',
      })
    })

    // public suffix example of a private tld
    it('parses https://example.herokuapp.com', function () {
      expectUrlToBeParsedCorrectly('https://example.herokuapp.com', {
        port: '443',
        domain: 'example',
        tld: 'herokuapp.com',
      })
    })

    it('parses http://www.local.nl', function () {
      expectUrlToBeParsedCorrectly('http://www.local.nl', {
        port: '80',
        domain: 'local',
        tld: 'nl',
      })
    })

    // https://github.com/cypress-io/cypress/issues/3717
    it('parses http://dev.classea12.beta.gouv.fr', function () {
      expectUrlToBeParsedCorrectly('http://dev.classea12.beta.gouv.fr', {
        port: '80',
        domain: 'beta',
        tld: 'gouv.fr',
      })
    })

    it('parses http://www.local.nl:8080', function () {
      expectUrlToBeParsedCorrectly('http://www.local.nl:8080', {
        port: '8080',
        domain: 'local',
        tld: 'nl',
      })
    })

    it('parses 192.168.1.1:8080', function () {
      expectUrlToBeParsedCorrectly('http://192.168.1.1:8080', {
        port: '8080',
        domain: '',
        tld: '192.168.1.1',
      })
    })
  })

  context('.urlMatchesOriginPolicyProps', () => {
    const assertOriginsDoNotMatch = (url, props) => {
      expect(cors.urlMatchesOriginPolicyProps(url, props)).to.be.false
    }

    const assertOriginsDoMatch = (url, props) => {
      expect(cors.urlMatchesOriginPolicyProps(url, props)).to.be.true
    }

    describe('domain + subdomain', () => {
      const props = cors.parseUrlIntoDomainTldPort('https://staging.google.com')

      it('does not match', function () {
        assertOriginsDoNotMatch('https://foo.bar:443', props)
        assertOriginsDoNotMatch('http://foo.bar:80', props)
        assertOriginsDoNotMatch('http://foo.bar', props)
        assertOriginsDoNotMatch('http://staging.google.com', props)
        assertOriginsDoNotMatch('http://staging.google.com:80', props)
        assertOriginsDoNotMatch('https://staging.google2.com:443', props)
        assertOriginsDoNotMatch('https://staging.google.net:443', props)
        assertOriginsDoNotMatch('https://google.net:443', props)
        assertOriginsDoNotMatch('http://google.com', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://staging.google.com:443', props)
        assertOriginsDoMatch('https://google.com:443', props)
        assertOriginsDoMatch('https://foo.google.com:443', props)
        assertOriginsDoMatch('https://foo.bar.google.com:443', props)
      })
    })

    describe('public suffix', () => {
      const props = cors.parseUrlIntoDomainTldPort('https://example.gitlab.io')

      it('does not match', function () {
        assertOriginsDoNotMatch('http://example.gitlab.io', props)
        assertOriginsDoNotMatch('https://foo.gitlab.io:443', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://example.gitlab.io:443', props)
        assertOriginsDoMatch('https://foo.example.gitlab.io:443', props)
      })
    })

    describe('localhost', () => {
      const props = cors.parseUrlIntoDomainTldPort('http://localhost:4200')

      it('does not match', function () {
        assertOriginsDoNotMatch('http://localhost:4201', props)
        assertOriginsDoNotMatch('http://localhoss:4200', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://localhost:4200', props)
      })
    })

    describe('app.localhost', () => {
      const props = cors.parseUrlIntoDomainTldPort('http://app.localhost:4200')

      it('does not match', function () {
        assertOriginsDoNotMatch('http://app.localhost:4201', props)
        assertOriginsDoNotMatch('http://app.localhoss:4200', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://app.localhost:4200', props)
        assertOriginsDoMatch('http://name.app.localhost:4200', props)
      })
    })

    describe('local', () => {
      const props = cors.parseUrlIntoDomainTldPort('http://brian.dev.local')

      it('does not match', function () {
        assertOriginsDoNotMatch('https://brian.dev.local:443', props)
        assertOriginsDoNotMatch('https://brian.dev.local', props)
        assertOriginsDoNotMatch('http://brian.dev2.local:81', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://jennifer.dev.local:80', props)
        assertOriginsDoMatch('http://jennifer.dev.local', props)
      })
    })

    describe('ip address', () => {
      const props = cors.parseUrlIntoDomainTldPort('http://192.168.5.10')

      it('does not match', function () {
        assertOriginsDoNotMatch('http://192.168.5.10:443', props)
        assertOriginsDoNotMatch('https://192.168.5.10', props)
        assertOriginsDoNotMatch('http://193.168.5.10', props)
        assertOriginsDoNotMatch('http://193.168.5.10:80', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://192.168.5.10', props)
        assertOriginsDoMatch('http://192.168.5.10:80', props)
      })
    })
  })

  context('.urlOriginsMatch', () => {
    const assertOriginsDoNotMatch = (url1, url2) => {
      expect(cors.urlOriginsMatch(url1, url2)).to.be.false
    }

    const assertOriginsDoMatch = (url1, url2) => {
      expect(cors.urlOriginsMatch(url1, url2)).to.be.true
    }

    describe('domain + subdomain', () => {
      const url = 'https://staging.google.com'

      it('does not match', function () {
        assertOriginsDoNotMatch('https://foo.bar:443', url)
        assertOriginsDoNotMatch('http://foo.bar:80', url)
        assertOriginsDoNotMatch('http://foo.bar', url)
        assertOriginsDoNotMatch('http://staging.google.com', url)
        assertOriginsDoNotMatch('http://staging.google.com:80', url)
        assertOriginsDoNotMatch('https://staging.google2.com:443', url)
        assertOriginsDoNotMatch('https://staging.google.net:443', url)
        assertOriginsDoNotMatch('https://google.net:443', url)
        assertOriginsDoNotMatch('http://google.com', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://staging.google.com:443', url)
        assertOriginsDoMatch('https://google.com:443', url)
        assertOriginsDoMatch('https://foo.google.com:443', url)
        assertOriginsDoMatch('https://foo.bar.google.com:443', url)
      })
    })

    describe('public suffix', () => {
      const url = 'https://example.gitlab.io'

      it('does not match', function () {
        assertOriginsDoNotMatch('http://example.gitlab.io', url)
        assertOriginsDoNotMatch('https://foo.gitlab.io:443', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://example.gitlab.io:443', url)
        assertOriginsDoMatch('https://foo.example.gitlab.io:443', url)
      })
    })

    describe('localhost', () => {
      const url = 'http://localhost:4200'

      it('does not match', function () {
        assertOriginsDoNotMatch('http://localhoss:4200', url)
        assertOriginsDoNotMatch('http://localhost:4201', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://localhost:4200', url)
      })
    })

    describe('app.localhost', () => {
      const url = 'http://app.localhost:4200'

      it('does not match', function () {
        assertOriginsDoNotMatch('http://app.localhoss:4200', url)
        assertOriginsDoNotMatch('http://app.localhost:4201', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://app.localhost:4200', url)
        assertOriginsDoMatch('http://name.app.localhost:4200', url)
      })
    })

    describe('local', () => {
      const url = 'http://brian.dev.local'

      it('does not match', function () {
        assertOriginsDoNotMatch('https://brian.dev.local:443', url)
        assertOriginsDoNotMatch('https://brian.dev.local', url)
        assertOriginsDoNotMatch('http://brian.dev2.local:81', url)
        assertOriginsDoNotMatch('http://jennifer.dev.local:4201', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://jennifer.dev.local:80', url)
        assertOriginsDoMatch('http://jennifer.dev.local', url)
      })
    })

    describe('ip address', () => {
      const url = 'http://192.168.5.10'

      it('does not match', function () {
        assertOriginsDoNotMatch('http://192.168.5.10:443', url)
        assertOriginsDoNotMatch('https://192.168.5.10', url)
        assertOriginsDoNotMatch('http://193.168.5.10', url)
        assertOriginsDoNotMatch('http://193.168.5.10:80', url)
        assertOriginsDoNotMatch('http://192.168.5.10:12345', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://192.168.5.10', url)
        assertOriginsDoMatch('http://192.168.5.10:80', url)
      })
    })
  })

  context('.urlMatchesOriginProtectionSpace', () => {
    const assertMatchesOriginProtectionSpace = (urlStr, origin) => {
      expect(urlStr, `the url: '${urlStr}' did not match origin protection space: '${origin}'`).to.satisfy(() => {
        return cors.urlMatchesOriginProtectionSpace(urlStr, origin)
      })
    }

    const assertDoesNotMatchOriginProtectionSpace = (urlStr, origin) => {
      expect(urlStr, `the url: '${urlStr}' matched origin protection space: '${origin}'`)
      .not.to.satisfy(() => {
        return cors.urlMatchesOriginProtectionSpace(urlStr, origin)
      })
    }

    it('ports', () => {
      assertMatchesOriginProtectionSpace('http://example.com/', 'http://example.com:80')
      assertMatchesOriginProtectionSpace('http://example.com:80/', 'http://example.com')
      assertMatchesOriginProtectionSpace('http://example.com:80/', 'http://example.com:80')
      assertMatchesOriginProtectionSpace('https://example.com:443/', 'https://example.com:443')
      assertMatchesOriginProtectionSpace('https://example.com:443/', 'https://example.com')
      assertMatchesOriginProtectionSpace('https://example.com/', 'https://example.com:443')

      assertDoesNotMatchOriginProtectionSpace('https://example.com:1234/', 'https://example.com')
      assertDoesNotMatchOriginProtectionSpace('https://example.com:1234/', 'https://example.com:443')
    })

    it('schemes', () => {
      assertDoesNotMatchOriginProtectionSpace('http://example.com/', 'https://example.com')
      assertDoesNotMatchOriginProtectionSpace('https://example.com/', 'http://example.com')
      assertDoesNotMatchOriginProtectionSpace('http://example.com/', 'ftp://example.com')
      assertDoesNotMatchOriginProtectionSpace('http://example.com/', 'file://example.com')
    })

    it('does not factor in path or search', () => {
      assertMatchesOriginProtectionSpace('http://example.com/foo', 'http://example.com')
      assertMatchesOriginProtectionSpace('http://example.com/foo/bar', 'http://example.com')
      assertMatchesOriginProtectionSpace('http://example.com/?foo=bar', 'http://example.com')
      assertMatchesOriginProtectionSpace('http://example.com/foo?bar=baz', 'http://example.com')
    })

    it('subdomains', () => {
      assertMatchesOriginProtectionSpace('http://example.com/', 'http://example.com')
      assertMatchesOriginProtectionSpace('http://www.example.com/', 'http://www.example.com')
      assertMatchesOriginProtectionSpace('http://foo.bar.example.com/', 'http://foo.bar.example.com')

      assertDoesNotMatchOriginProtectionSpace('http://www.example.com/', 'http://example.com')
      assertDoesNotMatchOriginProtectionSpace('http://foo.example.com/', 'http://bar.example.com')
      assertDoesNotMatchOriginProtectionSpace('http://foo.example.com/', 'http://foo.bar.example.com')
    })
  })

  context('.getOriginPolicy', () => {
    it('ports', () => {
      expect(cors.getOriginPolicy('https://example.com')).to.equal('https://example.com')
      expect(cors.getOriginPolicy('http://example.com:8080')).to.equal('http://example.com:8080')
    })

    it('subdomain', () => {
      expect(cors.getOriginPolicy('http://www.example.com')).to.equal('http://example.com')
      expect(cors.getOriginPolicy('http://www.app.herokuapp.com:8080')).to.equal('http://app.herokuapp.com:8080')
    })
  })
})
