import { cors } from '../../lib'
import { expect } from 'chai'

describe('lib/cors', () => {
  context('.parseUrlIntoHostProtocolDomainTldPort', () => {
    const expectUrlToBeParsedCorrectly = (url, obj) => {
      expect(cors.parseUrlIntoHostProtocolDomainTldPort(url)).to.deep.eq(obj)
    }

    it('parses https://www.google.com', function () {
      expectUrlToBeParsedCorrectly('https://www.google.com', {
        port: '443',
        domain: 'google',
        tld: 'com',
        subdomain: 'www',
        protocol: 'https:',
      })
    })

    it('parses http://localhost:8080', function () {
      expectUrlToBeParsedCorrectly('http://localhost:8080', {
        port: '8080',
        domain: '',
        tld: 'localhost',
        subdomain: null,
        protocol: 'http:',
      })
    })

    it('parses http://app.localhost:8080', function () {
      expectUrlToBeParsedCorrectly('http://app.localhost:8080', {
        port: '8080',
        domain: 'app',
        tld: 'localhost',
        subdomain: null,
        protocol: 'http:',
      })
    })

    it('parses http://app.localhost.dev:8080', function () {
      expectUrlToBeParsedCorrectly('http://app.localhost.dev:8080', {
        port: '8080',
        domain: 'localhost',
        tld: 'dev',
        subdomain: 'app',
        protocol: 'http:',
      })
    })

    it('parses http://app.local:8080', function () {
      expectUrlToBeParsedCorrectly('http://app.local:8080', {
        port: '8080',
        domain: 'app',
        tld: 'local',
        subdomain: null,
        protocol: 'http:',
      })
    })

    // public suffix example of a private tld
    it('parses https://example.herokuapp.com', function () {
      expectUrlToBeParsedCorrectly('https://example.herokuapp.com', {
        port: '443',
        domain: 'example',
        tld: 'herokuapp.com',
        subdomain: null,
        protocol: 'https:',
      })
    })

    it('parses http://www.local.nl', function () {
      expectUrlToBeParsedCorrectly('http://www.local.nl', {
        port: '80',
        domain: 'local',
        tld: 'nl',
        subdomain: 'www',
        protocol: 'http:',
      })
    })

    it('parses http://dev.classea12.beta.gouv.fr', function () {
      expectUrlToBeParsedCorrectly('http://dev.classea12.beta.gouv.fr', {
        port: '80',
        domain: 'beta',
        tld: 'gouv.fr',
        subdomain: 'dev.classea12',
        protocol: 'http:',
      })
    })

    it('parses http://www.local.nl:8080', function () {
      expectUrlToBeParsedCorrectly('http://www.local.nl:8080', {
        port: '8080',
        domain: 'local',
        tld: 'nl',
        subdomain: 'www',
        protocol: 'http:',
      })
    })

    it('parses 192.168.1.1:8080', function () {
      expectUrlToBeParsedCorrectly('http://192.168.1.1:8080', {
        port: '8080',
        domain: '',
        tld: '192.168.1.1',
        subdomain: null,
        protocol: 'http:',
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
        assertOriginsDoNotMatch('https://google.com:443', url)
        assertOriginsDoNotMatch('https://foo.google.com:443', url)
        assertOriginsDoNotMatch('https://foo.bar.google.com:443', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://staging.google.com:443', url)
      })
    })

    describe('public suffix', () => {
      const url = 'https://example.gitlab.io'

      it('does not match', function () {
        assertOriginsDoNotMatch('http://example.gitlab.io', url)
        assertOriginsDoNotMatch('https://foo.gitlab.io:443', url)
        assertOriginsDoNotMatch('https://foo.example.gitlab.io:443', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://example.gitlab.io:443', url)
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
        assertOriginsDoNotMatch('http://name.app.localhost:4200', url)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://app.localhost:4200', url)
      })
    })

    describe('local', () => {
      const url = 'http://brian.dev.local'

      it('does not match', function () {
        assertOriginsDoNotMatch('https://brian.dev.local:443', url)
        assertOriginsDoNotMatch('https://brian.dev.local', url)
        assertOriginsDoNotMatch('http://brian.dev2.local:81', url)
        assertOriginsDoNotMatch('http://jennifer.dev.local:4201', url)
        assertOriginsDoNotMatch('http://jennifer.dev.local:80', url)
        assertOriginsDoNotMatch('http://jennifer.dev.local', url)
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

  context('.urlSameSiteMatch', () => {
    const assertsUrlsAreNotSameSite = (url1, url2) => {
      expect(cors.urlSameSiteMatch(url1, url2)).to.be.false
    }

    const assertsUrlsAreSameSite = (url1, url2) => {
      expect(cors.urlSameSiteMatch(url1, url2)).to.be.true
    }

    describe('domain + subdomain', () => {
      const url = 'https://staging.google.com'

      it('does not match', function () {
        assertsUrlsAreNotSameSite('https://foo.bar:443', url)
        assertsUrlsAreNotSameSite('http://foo.bar:80', url)
        assertsUrlsAreNotSameSite('http://foo.bar', url)
        assertsUrlsAreNotSameSite('http://staging.google.com', url)
        assertsUrlsAreNotSameSite('http://staging.google.com:80', url)
        assertsUrlsAreNotSameSite('https://staging.google2.com:443', url)
        assertsUrlsAreNotSameSite('https://staging.google.net:443', url)
        assertsUrlsAreNotSameSite('https://google.net:443', url)
        assertsUrlsAreNotSameSite('http://google.com', url)
      })

      it('matches', function () {
        assertsUrlsAreSameSite('https://staging.google.com:443', url)
        assertsUrlsAreSameSite('https://google.com:443', url)
        assertsUrlsAreSameSite('https://foo.google.com:443', url)
        assertsUrlsAreSameSite('https://foo.bar.google.com:443', url)
      })
    })

    describe('public suffix', () => {
      const url = 'https://example.gitlab.io'

      it('does not match', function () {
        assertsUrlsAreNotSameSite('http://example.gitlab.io', url)
        assertsUrlsAreNotSameSite('https://foo.gitlab.io:443', url)
      })

      it('matches', function () {
        assertsUrlsAreSameSite('https://example.gitlab.io:443', url)
        assertsUrlsAreSameSite('https://foo.example.gitlab.io:443', url)
      })
    })

    describe('localhost', () => {
      const url = 'http://localhost:4200'

      it('does not match', function () {
        assertsUrlsAreNotSameSite('http://localhoss:4200', url)
      })

      it('matches', function () {
        assertsUrlsAreSameSite('http://localhost:4200', url)
        assertsUrlsAreSameSite('http://localhost:4201', url)
      })
    })

    describe('app.localhost', () => {
      const url = 'http://app.localhost:4200'

      it('does not match', function () {
        assertsUrlsAreNotSameSite('http://app.localhoss:4200', url)
      })

      it('matches', function () {
        assertsUrlsAreSameSite('http://app.localhost:4200', url)
        assertsUrlsAreSameSite('http://name.app.localhost:4200', url)
        assertsUrlsAreSameSite('http://app.localhost:4201', url)
      })
    })

    describe('local', () => {
      const url = 'http://brian.dev.local'

      it('does not match', function () {
        assertsUrlsAreNotSameSite('https://brian.dev.local:443', url)
        assertsUrlsAreNotSameSite('https://brian.dev.local', url)
        assertsUrlsAreNotSameSite('http://brian.dev2.local:81', url)
      })

      it('matches', function () {
        assertsUrlsAreSameSite('http://jennifer.dev.local:4201', url)
        assertsUrlsAreSameSite('http://jennifer.dev.local:80', url)
        assertsUrlsAreSameSite('http://jennifer.dev.local', url)
        assertsUrlsAreSameSite('http://brian.dev.local:8081', url)
      })
    })

    describe('ip address', () => {
      const url = 'http://192.168.5.10'

      it('does not match', function () {
        assertsUrlsAreNotSameSite('http://192.168.5.10:443', url)
        assertsUrlsAreNotSameSite('https://192.168.5.10', url)
        assertsUrlsAreNotSameSite('http://193.168.5.10', url)
        assertsUrlsAreNotSameSite('http://193.168.5.10:80', url)
      })

      it('matches', function () {
        assertsUrlsAreSameSite('http://192.168.5.10', url)
        assertsUrlsAreSameSite('http://192.168.5.10:80', url)
        assertsUrlsAreSameSite('http://192.168.5.10:12345', url)
      })
    })
  })

  context('.urlMatchesPolicyBasedOnDomain', () => {
    const assertsUrlsAreNotAPolicyMatch = (url1, url2) => {
      expect(cors.urlMatchesPolicyBasedOnDomain(url1, url2)).to.be.false
    }

    const assertsUrlsAreAPolicyOriginMatch = (url1, url2) => {
      expect(cors.urlMatchesPolicyBasedOnDomain(url1, url2)).to.be.true
    }

    describe('domain + subdomain', () => {
      const url = 'https://staging.gurgle.com'

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('https://foo.bar:443', url)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar:80', url)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar', url)
        assertsUrlsAreNotAPolicyMatch('http://staging.gurgle.com', url)
        assertsUrlsAreNotAPolicyMatch('http://staging.gurgle.com:80', url)
        assertsUrlsAreNotAPolicyMatch('https://staging.gurgle2.com:443', url)
        assertsUrlsAreNotAPolicyMatch('https://staging.gurgle.net:443', url)
        assertsUrlsAreNotAPolicyMatch('https://gurgle.net:443', url)
        assertsUrlsAreNotAPolicyMatch('http://gurgle.com', url)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('https://staging.gurgle.com:443', url)
        assertsUrlsAreAPolicyOriginMatch('https://gurgle.com:443', url)
        assertsUrlsAreAPolicyOriginMatch('https://foo.gurgle.com:443', url)
        assertsUrlsAreAPolicyOriginMatch('https://foo.bar.gurgle.com:443', url)
      })
    })

    describe('google (strict same-origin policy)', () => {
      const url = 'https://staging.google.com'

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('https://foo.bar:443', url)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar:80', url)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar', url)
        assertsUrlsAreNotAPolicyMatch('http://staging.google.com', url)
        assertsUrlsAreNotAPolicyMatch('http://staging.google.com:80', url)
        assertsUrlsAreNotAPolicyMatch('https://staging.google2.com:443', url)
        assertsUrlsAreNotAPolicyMatch('https://staging.google.net:443', url)
        assertsUrlsAreNotAPolicyMatch('https://google.net:443', url)
        assertsUrlsAreNotAPolicyMatch('http://google.com', url)
        assertsUrlsAreNotAPolicyMatch('https://google.com:443', url)
        assertsUrlsAreNotAPolicyMatch('https://foo.google.com:443', url)
        assertsUrlsAreNotAPolicyMatch('https://foo.bar.google.com:443', url)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('https://staging.google.com:443', url)
      })
    })

    describe('public suffix', () => {
      const url = 'https://example.gitlab.io'

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://example.gitlab.io', url)
        assertsUrlsAreNotAPolicyMatch('https://foo.gitlab.io:443', url)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('https://example.gitlab.io:443', url)
        assertsUrlsAreAPolicyOriginMatch('https://foo.example.gitlab.io:443', url)
      })
    })

    describe('localhost', () => {
      const url = 'http://localhost:4200'

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://localhoss:4200', url)
        assertsUrlsAreNotAPolicyMatch('http://localhost:4201', url)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://localhost:4200', url)
      })
    })

    describe('app.localhost', () => {
      const url = 'http://app.localhost:4200'

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://app.localhoss:4200', url)
        assertsUrlsAreNotAPolicyMatch('http://app.localhost:4201', url)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://app.localhost:4200', url)
        assertsUrlsAreAPolicyOriginMatch('http://name.app.localhost:4200', url)
      })
    })

    describe('local', () => {
      const url = 'http://brian.dev.local'

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('https://brian.dev.local:443', url)
        assertsUrlsAreNotAPolicyMatch('https://brian.dev.local', url)
        assertsUrlsAreNotAPolicyMatch('http://brian.dev2.local:81', url)
        assertsUrlsAreNotAPolicyMatch('http://brian.dev.local:8081', url)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://jennifer.dev.local', url)
        assertsUrlsAreAPolicyOriginMatch('http://jennifer.dev.local:80', url)
        assertsUrlsAreAPolicyOriginMatch('http://jennifer.dev.local', url)
      })
    })

    describe('ip address', () => {
      const url = 'http://192.168.5.10'

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://192.168.5.10:443', url)
        assertsUrlsAreNotAPolicyMatch('https://192.168.5.10', url)
        assertsUrlsAreNotAPolicyMatch('http://193.168.5.10', url)
        assertsUrlsAreNotAPolicyMatch('http://193.168.5.10:80', url)
        assertsUrlsAreNotAPolicyMatch('http://192.168.5.10:12345', url)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://192.168.5.10', url)
        assertsUrlsAreAPolicyOriginMatch('http://192.168.5.10:80', url)
      })
    })
  })

  context('.urlMatchesPolicyBasedOnDomainProps', () => {
    const assertsUrlsAreNotAPolicyMatch = (url1, props) => {
      expect(cors.urlMatchesPolicyBasedOnDomainProps(url1, props)).to.be.false
    }

    const assertsUrlsAreAPolicyOriginMatch = (url1, props) => {
      expect(cors.urlMatchesPolicyBasedOnDomainProps(url1, props)).to.be.true
    }

    describe('domain + subdomain', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://staging.gurgle.com')

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('https://foo.bar:443', props)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar:80', props)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar', props)
        assertsUrlsAreNotAPolicyMatch('http://staging.gurgle.com', props)
        assertsUrlsAreNotAPolicyMatch('http://staging.gurgle.com:80', props)
        assertsUrlsAreNotAPolicyMatch('https://staging.gurgle2.com:443', props)
        assertsUrlsAreNotAPolicyMatch('https://staging.gurgle.net:443', props)
        assertsUrlsAreNotAPolicyMatch('https://gurgle.net:443', props)
        assertsUrlsAreNotAPolicyMatch('http://gurgle.com', props)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('https://staging.gurgle.com:443', props)
        assertsUrlsAreAPolicyOriginMatch('https://gurgle.com:443', props)
        assertsUrlsAreAPolicyOriginMatch('https://foo.gurgle.com:443', props)
        assertsUrlsAreAPolicyOriginMatch('https://foo.bar.gurgle.com:443', props)
      })
    })

    describe('google (strict same-origin policy)', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://staging.google.com')

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('https://foo.bar:443', props)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar:80', props)
        assertsUrlsAreNotAPolicyMatch('http://foo.bar', props)
        assertsUrlsAreNotAPolicyMatch('http://staging.google.com', props)
        assertsUrlsAreNotAPolicyMatch('http://staging.google.com:80', props)
        assertsUrlsAreNotAPolicyMatch('https://staging.google2.com:443', props)
        assertsUrlsAreNotAPolicyMatch('https://staging.google.net:443', props)
        assertsUrlsAreNotAPolicyMatch('https://google.net:443', props)
        assertsUrlsAreNotAPolicyMatch('http://google.com', props)
        assertsUrlsAreNotAPolicyMatch('https://google.com:443', props)
        assertsUrlsAreNotAPolicyMatch('https://foo.google.com:443', props)
        assertsUrlsAreNotAPolicyMatch('https://foo.bar.google.com:443', props)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('https://staging.google.com:443', props)
      })
    })

    describe('public suffix', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://example.gitlab.io')

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://example.gitlab.io', props)
        assertsUrlsAreNotAPolicyMatch('https://foo.gitlab.io:443', props)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('https://example.gitlab.io:443', props)
        assertsUrlsAreAPolicyOriginMatch('https://foo.example.gitlab.io:443', props)
      })
    })

    describe('localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://localhost:4200')

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://localhoss:4200', props)
        assertsUrlsAreNotAPolicyMatch('http://localhost:4201', props)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://localhost:4200', props)
      })
    })

    describe('app.localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://app.localhost:4200')

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://app.localhoss:4200', props)
        assertsUrlsAreNotAPolicyMatch('http://app.localhost:4201', props)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://app.localhost:4200', props)
        assertsUrlsAreAPolicyOriginMatch('http://name.app.localhost:4200', props)
      })
    })

    describe('local', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://brian.dev.local')

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('https://brian.dev.local:443', props)
        assertsUrlsAreNotAPolicyMatch('https://brian.dev.local', props)
        assertsUrlsAreNotAPolicyMatch('http://brian.dev2.local:81', props)
        assertsUrlsAreNotAPolicyMatch('http://brian.dev.local:8081', props)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://jennifer.dev.local', props)
        assertsUrlsAreAPolicyOriginMatch('http://jennifer.dev.local:80', props)
        assertsUrlsAreAPolicyOriginMatch('http://jennifer.dev.local', props)
      })
    })

    describe('ip address', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://192.168.5.10')

      it('does not match', function () {
        assertsUrlsAreNotAPolicyMatch('http://192.168.5.10:443', props)
        assertsUrlsAreNotAPolicyMatch('https://192.168.5.10', props)
        assertsUrlsAreNotAPolicyMatch('http://193.168.5.10', props)
        assertsUrlsAreNotAPolicyMatch('http://193.168.5.10:80', props)
        assertsUrlsAreNotAPolicyMatch('http://192.168.5.10:12345', props)
      })

      it('matches', function () {
        assertsUrlsAreAPolicyOriginMatch('http://192.168.5.10', props)
        assertsUrlsAreAPolicyOriginMatch('http://192.168.5.10:80', props)
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

  context('.getSuperDomainOrigin', () => {
    it('ports', () => {
      expect(cors.getSuperDomainOrigin('https://example.com')).to.equal('https://example.com')
      expect(cors.getSuperDomainOrigin('http://example.com:8080')).to.equal('http://example.com:8080')
    })

    it('subdomain', () => {
      expect(cors.getSuperDomainOrigin('http://www.example.com')).to.equal('http://example.com')
      expect(cors.getSuperDomainOrigin('http://www.app.herokuapp.com:8080')).to.equal('http://app.herokuapp.com:8080')
    })
  })

  context('.getOrigin', () => {
    it('ports', () => {
      expect(cors.getOrigin('https://example.com')).to.equal('https://example.com')
      expect(cors.getOrigin('http://example.com:8080')).to.equal('http://example.com:8080')
    })

    it('subdomain', () => {
      expect(cors.getOrigin('http://www.example.com')).to.equal('http://www.example.com')
      expect(cors.getOrigin('http://www.app.herokuapp.com:8080')).to.equal('http://www.app.herokuapp.com:8080')
    })
  })
})
