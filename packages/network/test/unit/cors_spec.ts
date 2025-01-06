import { cors } from '../../lib'
import { Policy } from '../../lib/cors'
import { expect } from 'chai'
import type { ParsedHostWithProtocolAndHost } from '../../lib/types'

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

  context('.urlMatchesPolicyProps', () => {
    let policy: Policy
    let frameUrl: string
    let topProps: ParsedHostWithProtocolAndHost

    describe('with a same-origin policy', () => {
      beforeEach(() => {
        policy = 'same-origin'
      })

      describe('and origin matches', () => {
        beforeEach(() => {
          frameUrl = 'http://www.foo.com'
          topProps = cors.parseUrlIntoHostProtocolDomainTldPort(frameUrl)
        })

        it('matches', () => {
          expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.true
        })
      })

      describe('and origin does not match', () => {
        beforeEach(() => {
          frameUrl = 'http://www.foo.com'
          topProps = cors.parseUrlIntoHostProtocolDomainTldPort('http://www.bar.com')
        })

        it('does not match', () => {
          expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.false
        })
      })
    })

    describe('with a same-super-domain-origin policy', () => {
      beforeEach(() => {
        policy = 'same-super-domain-origin'
      })

      describe('and origin matches', () => {
        beforeEach(() => {
          frameUrl = 'http://www.foo.com'
          topProps = cors.parseUrlIntoHostProtocolDomainTldPort(frameUrl)
        })

        it('matches', () => {
          expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.true
        })
      })

      describe('and superdomains match', () => {
        const superdomain = 'foo.com'
        const port = '8080'

        beforeEach(() => {
          frameUrl = `http://www.${superdomain}`
          topProps = cors.parseUrlIntoHostProtocolDomainTldPort(`http://docs.${superdomain}:${port}`)
        })

        describe('and the ports are not strictly equal', () => {
          it('does not match', () => {
            expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.false
          })
        })

        describe('and the ports are strictly equal', () => {
          beforeEach(() => {
            frameUrl = `${frameUrl}:${port}`
            topProps.port = port
          })

          it('does match', () => {
            expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.true
          })
        })
      })

      describe('and superdomains do not match', () => {
        beforeEach(() => {
          frameUrl = 'http://www.foo.com'
          topProps = cors.parseUrlIntoHostProtocolDomainTldPort('http://www.bar.com')
        })

        it('does not match', () => {
          expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.false
        })
      })
    })

    describe('with a schemeful-same-site policy', () => {
      beforeEach(() => {
        policy = 'schemeful-same-site'
      })

      describe('and origin matches', () => {
        beforeEach(() => {
          frameUrl = 'http://www.foo.com'
          topProps = cors.parseUrlIntoHostProtocolDomainTldPort('http://www.foo.com')
        })

        it('matches', () => {
          expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.true
        })
      })

      describe('and superdomains match', () => {
        beforeEach(() => {
          frameUrl = 'http://www.foo.com'
          topProps = cors.parseUrlIntoHostProtocolDomainTldPort('http://docs.foo.com')
        })

        describe('and neither ports match with neither being 443', () => {
          beforeEach(() => {
            frameUrl = `${frameUrl}:8080`
            topProps.port = '8081'
          })

          it('matches', () => {
            expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.true
          })
        })

        describe('and neither ports match but frameUrl is 443 / https', () => {
          beforeEach(() => {
            frameUrl = 'https://www.foo.com'
            topProps.port = '8081'
          })

          it('does not match', () => {
            expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.false
          })
        })

        describe('and neither ports match but topProps is 443 / https', () => {
          beforeEach(() => {
            frameUrl = `${frameUrl}:8080`
            topProps = cors.parseUrlIntoHostProtocolDomainTldPort('https://www.foo.com')
          })

          it('does not match', () => {
            expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.false
          })
        })

        describe('and the ports match', () => {
          beforeEach(() => {
            frameUrl = `${frameUrl}:8080`
            topProps.port = `8080`
          })

          it('matches', () => {
            expect(cors.urlMatchesPolicyProps({ policy, frameUrl, topProps })).to.be.true
          })
        })
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

  context('.policyFromConfig', () => {
    it('returns \'same-origin\' when injectDocumentDomain is false', () => {
      expect(cors.policyFromConfig({ injectDocumentDomain: false })).to.equal('same-origin')
    })

    it('returns \'same-super-domain-origin\' when injectDocumentDomain is true', () => {
      expect(cors.policyFromConfig({ injectDocumentDomain: true })).to.equal('same-super-domain-origin')
    })
  })
})
