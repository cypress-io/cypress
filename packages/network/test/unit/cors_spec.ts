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

  context('.urlMatchesOriginProps', () => {
    const assertOriginsDoNotMatch = (url, props) => {
      expect(cors.urlMatchesOriginProps(url, props)).to.be.false
    }

    const assertOriginsDoMatch = (url, props) => {
      expect(cors.urlMatchesOriginProps(url, props)).to.be.true
    }

    describe('domain + subdomain', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://staging.google.com')

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
        assertOriginsDoNotMatch('https://google.com:443', props)
        assertOriginsDoNotMatch('https://foo.google.com:443', props)
        assertOriginsDoNotMatch('https://foo.bar.google.com:443', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://staging.google.com:443', props)
      })
    })

    describe('public suffix', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://example.gitlab.io')

      it('does not match', function () {
        assertOriginsDoNotMatch('http://example.gitlab.io', props)
        assertOriginsDoNotMatch('https://foo.gitlab.io:443', props)
        assertOriginsDoNotMatch('https://foo.example.gitlab.io:443', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('https://example.gitlab.io:443', props)
      })
    })

    describe('localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://localhost:4200')

      it('does not match', function () {
        assertOriginsDoNotMatch('http://localhost:4201', props)
        assertOriginsDoNotMatch('http://localhoss:4200', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://localhost:4200', props)
      })
    })

    describe('app.localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://app.localhost:4200')

      it('does not match', function () {
        assertOriginsDoNotMatch('http://app.localhost:4201', props)
        assertOriginsDoNotMatch('http://app.localhoss:4200', props)
        assertOriginsDoNotMatch('http://name.app.localhost:4200', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://app.localhost:4200', props)
      })
    })

    describe('local', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://brian.dev.local')

      it('does not match', function () {
        assertOriginsDoNotMatch('https://brian.dev.local:443', props)
        assertOriginsDoNotMatch('https://brian.dev.local', props)
        assertOriginsDoNotMatch('http://brian.dev2.local:81', props)
        assertOriginsDoNotMatch('http://jennifer.dev.local:80', props)
        assertOriginsDoNotMatch('http://jennifer.dev.local', props)
      })

      it('matches', function () {
        assertOriginsDoMatch('http://brian.dev.local:80', props)
      })
    })

    describe('ip address', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://192.168.5.10')

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

  context('.urlMatchesSuperDomainOriginProps', () => {
    const assertSuperDomainOriginDoesNotMatch = (url, props) => {
      expect(cors.urlMatchesSuperDomainOriginProps(url, props)).to.be.false
    }

    const assertSuperDomainOriginDoesMatch = (url, props) => {
      expect(cors.urlMatchesSuperDomainOriginProps(url, props)).to.be.true
    }

    describe('domain + subdomain', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://staging.google.com')

      it('does not match', function () {
        assertSuperDomainOriginDoesNotMatch('https://foo.bar:443', props)
        assertSuperDomainOriginDoesNotMatch('http://foo.bar:80', props)
        assertSuperDomainOriginDoesNotMatch('http://foo.bar', props)
        assertSuperDomainOriginDoesNotMatch('http://staging.google.com', props)
        assertSuperDomainOriginDoesNotMatch('http://staging.google.com:80', props)
        assertSuperDomainOriginDoesNotMatch('https://staging.google2.com:443', props)
        assertSuperDomainOriginDoesNotMatch('https://staging.google.net:443', props)
        assertSuperDomainOriginDoesNotMatch('https://google.net:443', props)
        assertSuperDomainOriginDoesNotMatch('http://google.com', props)
      })

      it('matches', function () {
        assertSuperDomainOriginDoesMatch('https://staging.google.com:443', props)
        assertSuperDomainOriginDoesMatch('https://google.com:443', props)
        assertSuperDomainOriginDoesMatch('https://foo.google.com:443', props)
        assertSuperDomainOriginDoesMatch('https://foo.bar.google.com:443', props)
      })
    })

    describe('public suffix', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://example.gitlab.io')

      it('does not match', function () {
        assertSuperDomainOriginDoesNotMatch('http://example.gitlab.io', props)
        assertSuperDomainOriginDoesNotMatch('https://foo.gitlab.io:443', props)
      })

      it('matches', function () {
        assertSuperDomainOriginDoesMatch('https://example.gitlab.io:443', props)
        assertSuperDomainOriginDoesMatch('https://foo.example.gitlab.io:443', props)
      })
    })

    describe('localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://localhost:4200')

      it('does not match', function () {
        assertSuperDomainOriginDoesNotMatch('http://localhoss:4200', props)
        assertSuperDomainOriginDoesNotMatch('http://localhost:4201', props)
      })

      it('matches', function () {
        assertSuperDomainOriginDoesMatch('http://localhost:4200', props)
      })
    })

    describe('app.localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://app.localhost:4200')

      it('does not match', function () {
        assertSuperDomainOriginDoesNotMatch('http://app.localhoss:4200', props)
        assertSuperDomainOriginDoesNotMatch('http://app.localhost:4201', props)
      })

      it('matches', function () {
        assertSuperDomainOriginDoesMatch('http://app.localhost:4200', props)
        assertSuperDomainOriginDoesMatch('http://name.app.localhost:4200', props)
      })
    })

    describe('local', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://brian.dev.local')

      it('does not match', function () {
        assertSuperDomainOriginDoesNotMatch('https://brian.dev.local:443', props)
        assertSuperDomainOriginDoesNotMatch('https://brian.dev.local', props)
        assertSuperDomainOriginDoesNotMatch('http://brian.dev2.local:81', props)
        assertSuperDomainOriginDoesNotMatch('http://brian.dev.local:8081', props)
      })

      it('matches', function () {
        assertSuperDomainOriginDoesMatch('http://brian.dev.local:80', props)
        assertSuperDomainOriginDoesMatch('http://jennifer.dev.local:80', props)
        assertSuperDomainOriginDoesMatch('http://jennifer.dev.local', props)
      })
    })

    describe('ip address', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://192.168.5.10')

      it('does not match', function () {
        assertSuperDomainOriginDoesNotMatch('http://192.168.5.10:443', props)
        assertSuperDomainOriginDoesNotMatch('https://192.168.5.10', props)
        assertSuperDomainOriginDoesNotMatch('http://193.168.5.10', props)
        assertSuperDomainOriginDoesNotMatch('http://193.168.5.10:80', props)
        assertSuperDomainOriginDoesNotMatch('http://192.168.5.10:8081', props)
      })

      it('matches', function () {
        assertSuperDomainOriginDoesMatch('http://192.168.5.10', props)
        assertSuperDomainOriginDoesMatch('http://192.168.5.10:80', props)
      })
    })
  })

  context('.urlMatchesSameSiteProps', () => {
    const assertSameSiteDoesNotMatch = (url, props) => {
      expect(cors.urlMatchesSameSiteProps(url, props)).to.be.false
    }

    const assertSameSiteDoesMatch = (url, props) => {
      expect(cors.urlMatchesSameSiteProps(url, props)).to.be.true
    }

    describe('domain + subdomain', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://staging.google.com')

      it('does not match', function () {
        assertSameSiteDoesNotMatch('https://foo.bar:443', props)
        assertSameSiteDoesNotMatch('http://foo.bar:80', props)
        assertSameSiteDoesNotMatch('http://foo.bar', props)
        assertSameSiteDoesNotMatch('http://staging.google.com', props)
        assertSameSiteDoesNotMatch('http://staging.google.com:80', props)
        assertSameSiteDoesNotMatch('https://staging.google2.com:443', props)
        assertSameSiteDoesNotMatch('https://staging.google.net:443', props)
        assertSameSiteDoesNotMatch('https://google.net:443', props)
        assertSameSiteDoesNotMatch('http://google.com', props)
      })

      it('matches', function () {
        assertSameSiteDoesMatch('https://staging.google.com:443', props)
        assertSameSiteDoesMatch('https://google.com:443', props)
        assertSameSiteDoesMatch('https://foo.google.com:443', props)
        assertSameSiteDoesMatch('https://foo.bar.google.com:443', props)
      })
    })

    describe('public suffix', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('https://example.gitlab.io')

      it('does not match', function () {
        assertSameSiteDoesNotMatch('http://example.gitlab.io', props)
        assertSameSiteDoesNotMatch('https://foo.gitlab.io:443', props)
      })

      it('matches', function () {
        assertSameSiteDoesMatch('https://example.gitlab.io:443', props)
        assertSameSiteDoesMatch('https://foo.example.gitlab.io:443', props)
      })
    })

    describe('localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://localhost:4200')

      it('does not match', function () {
        assertSameSiteDoesNotMatch('http://localhoss:4200', props)
      })

      it('matches', function () {
        assertSameSiteDoesMatch('http://localhost:4201', props)
        assertSameSiteDoesMatch('http://localhost:4200', props)
      })
    })

    describe('app.localhost', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://app.localhost:4200')

      it('does not match', function () {
        assertSameSiteDoesNotMatch('http://app.localhoss:4200', props)
      })

      it('matches', function () {
        assertSameSiteDoesMatch('http://app.localhost:4200', props)
        assertSameSiteDoesMatch('http://name.app.localhost:4200', props)
        assertSameSiteDoesMatch('http://app.localhost:4201', props)
      })
    })

    describe('local', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://brian.dev.local')

      it('does not match', function () {
        assertSameSiteDoesNotMatch('https://brian.dev.local:443', props)
        assertSameSiteDoesNotMatch('https://brian.dev.local', props)
        assertSameSiteDoesNotMatch('http://brian.dev2.local:81', props)
      })

      it('matches', function () {
        assertSameSiteDoesMatch('http://brian.dev.local:80', props)
        assertSameSiteDoesMatch('http://jennifer.dev.local:80', props)
        assertSameSiteDoesMatch('http://jennifer.dev.local', props)
        assertSameSiteDoesMatch('http://brian.dev.local:8081', props)
      })
    })

    describe('ip address', () => {
      const props = cors.parseUrlIntoHostProtocolDomainTldPort('http://192.168.5.10')

      it('does not match', function () {
        assertSameSiteDoesNotMatch('http://192.168.5.10:443', props)
        assertSameSiteDoesNotMatch('https://192.168.5.10', props)
        assertSameSiteDoesNotMatch('http://193.168.5.10', props)
        assertSameSiteDoesNotMatch('http://193.168.5.10:80', props)
      })

      it('matches', function () {
        assertSameSiteDoesMatch('http://192.168.5.10', props)
        assertSameSiteDoesMatch('http://192.168.5.10:80', props)
        assertSameSiteDoesMatch('http://192.168.5.10:8081', props)
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

  context('.urlsSuperDomainOriginMatch', () => {
    const assertsUrlsAreNotASuperDomainOriginMatch = (url1, url2) => {
      expect(cors.urlsSuperDomainOriginMatch(url1, url2)).to.be.false
    }

    const assertsUrlsAreASuperDomainOriginMatch = (url1, url2) => {
      expect(cors.urlsSuperDomainOriginMatch(url1, url2)).to.be.true
    }

    describe('domain + subdomain', () => {
      const url = 'https://staging.google.com'

      it('does not match', function () {
        assertsUrlsAreNotASuperDomainOriginMatch('https://foo.bar:443', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://foo.bar:80', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://foo.bar', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://staging.google.com', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://staging.google.com:80', url)
        assertsUrlsAreNotASuperDomainOriginMatch('https://staging.google2.com:443', url)
        assertsUrlsAreNotASuperDomainOriginMatch('https://staging.google.net:443', url)
        assertsUrlsAreNotASuperDomainOriginMatch('https://google.net:443', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://google.com', url)
      })

      it('matches', function () {
        assertsUrlsAreASuperDomainOriginMatch('https://staging.google.com:443', url)
        assertsUrlsAreASuperDomainOriginMatch('https://google.com:443', url)
        assertsUrlsAreASuperDomainOriginMatch('https://foo.google.com:443', url)
        assertsUrlsAreASuperDomainOriginMatch('https://foo.bar.google.com:443', url)
      })
    })

    describe('public suffix', () => {
      const url = 'https://example.gitlab.io'

      it('does not match', function () {
        assertsUrlsAreNotASuperDomainOriginMatch('http://example.gitlab.io', url)
        assertsUrlsAreNotASuperDomainOriginMatch('https://foo.gitlab.io:443', url)
      })

      it('matches', function () {
        assertsUrlsAreASuperDomainOriginMatch('https://example.gitlab.io:443', url)
        assertsUrlsAreASuperDomainOriginMatch('https://foo.example.gitlab.io:443', url)
      })
    })

    describe('localhost', () => {
      const url = 'http://localhost:4200'

      it('does not match', function () {
        assertsUrlsAreNotASuperDomainOriginMatch('http://localhoss:4200', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://localhost:4201', url)
      })

      it('matches', function () {
        assertsUrlsAreASuperDomainOriginMatch('http://localhost:4200', url)
      })
    })

    describe('app.localhost', () => {
      const url = 'http://app.localhost:4200'

      it('does not match', function () {
        assertsUrlsAreNotASuperDomainOriginMatch('http://app.localhoss:4200', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://app.localhost:4201', url)
      })

      it('matches', function () {
        assertsUrlsAreASuperDomainOriginMatch('http://app.localhost:4200', url)
        assertsUrlsAreASuperDomainOriginMatch('http://name.app.localhost:4200', url)
      })
    })

    describe('local', () => {
      const url = 'http://brian.dev.local'

      it('does not match', function () {
        assertsUrlsAreNotASuperDomainOriginMatch('https://brian.dev.local:443', url)
        assertsUrlsAreNotASuperDomainOriginMatch('https://brian.dev.local', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://brian.dev2.local:81', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://brian.dev.local:8081', url)
      })

      it('matches', function () {
        assertsUrlsAreASuperDomainOriginMatch('http://jennifer.dev.local', url)
        assertsUrlsAreASuperDomainOriginMatch('http://jennifer.dev.local:80', url)
        assertsUrlsAreASuperDomainOriginMatch('http://jennifer.dev.local', url)
      })
    })

    describe('ip address', () => {
      const url = 'http://192.168.5.10'

      it('does not match', function () {
        assertsUrlsAreNotASuperDomainOriginMatch('http://192.168.5.10:443', url)
        assertsUrlsAreNotASuperDomainOriginMatch('https://192.168.5.10', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://193.168.5.10', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://193.168.5.10:80', url)
        assertsUrlsAreNotASuperDomainOriginMatch('http://192.168.5.10:12345', url)
      })

      it('matches', function () {
        assertsUrlsAreASuperDomainOriginMatch('http://192.168.5.10', url)
        assertsUrlsAreASuperDomainOriginMatch('http://192.168.5.10:80', url)
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
