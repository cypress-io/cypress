import { expect } from 'chai'
import { DocumentDomainInjection, OriginBehavior, DocumentDomainBehavior } from '../../lib/document-domain-injection'
import { URL } from 'url'

describe('DocumentDomainInjection', () => {
  describe('InjectionBehavior', () => {
    let injectDocumentDomain: boolean
    let testingType: 'e2e' | 'component'

    const cfg = () => {
      return { injectDocumentDomain, testingType }
    }

    describe('when injectDocumentDomain config is false', () => {
      beforeEach(() => {
        injectDocumentDomain = false
      })

      describe('and testingType is e2e', () => {
        beforeEach(() => {
          testingType = 'e2e'
        })

        it('returns OriginBehavior', () => {
          expect(DocumentDomainInjection.InjectionBehavior(cfg())).to.be.instanceOf(OriginBehavior)
        })
      })

      describe('and testing type is component', () => {
        beforeEach(() => {
          testingType = 'component'
        })

        it('returns OriginBehavior', () => {
          expect(DocumentDomainInjection.InjectionBehavior(cfg())).to.be.instanceOf(OriginBehavior)
        })
      })
    })

    describe('when injectDocumentDomain config is true', () => {
      beforeEach(() => {
        injectDocumentDomain = true
      })

      describe('and testingType is e2e', () => {
        beforeEach(() => {
          testingType = 'e2e'
        })

        it('returns OriginBehavior', () => {
          expect(DocumentDomainInjection.InjectionBehavior(cfg())).to.be.instanceOf(DocumentDomainBehavior)
        })
      })

      describe('and testing type is component', () => {
        beforeEach(() => {
          testingType = 'component'
        })

        it('returns OriginBehavior', () => {
          expect(DocumentDomainInjection.InjectionBehavior(cfg())).to.be.instanceOf(OriginBehavior)
        })
      })
    })
  })

  describe('DocumentDomainBehavior', () => {
    let behavior: DocumentDomainBehavior

    beforeEach(() => {
      behavior = new DocumentDomainBehavior()
    })

    describe('getOrigin()', () => {
      it('returns superdomain origin with ports', () => {
        expect(behavior.getOrigin('https://example.com')).to.equal('https://example.com')
        expect(behavior.getOrigin('http://example.com:8080')).to.equal('http://example.com:8080')
      })

      it('returns superdomain origin with subdomains', () => {
        expect(behavior.getOrigin('http://www.example.com')).to.equal('http://example.com')
        expect(behavior.getOrigin('http://www.app.herokuapp.com:8080')).to.equal('http://app.herokuapp.com:8080')
      })
    })

    describe('.getHostname()', () => {
      it('returns superdomain hostname with ip address', () => {
        expect(behavior.getHostname('http://127.0.0.1')).to.equal('127.0.0.1')
      })

      it('returns superdomain hostname with domain', () => {
        expect(behavior.getHostname('http://foo.com')).to.equal('foo.com')
      })

      it('returns superdomain hostname with subdomains', () => {
        expect(behavior.getHostname('http://some.subdomain.foo.com')).to.equal('foo.com')
      })
    })

    describe('urlsMatch', () => {
      describe('when ports match', () => {
        describe('and superdomain matches', () => {
          it('returns true', () => {
            expect(behavior.urlsMatch('http://www.foo.com:8080', 'http://baz.foo.com:8080')).to.be.true
          })
        })

        describe('and superdomains do not match', () => {
          it('returns false', () => {
            expect(behavior.urlsMatch('http://www.foo.com:8080', 'http://baz.com:8080')).to.be.false
          })
        })
      })

      describe('when ports do not match', () => {
        describe('but superdomains match', () => {
          it('returns false', () => {
            expect(behavior.urlsMatch('https://staging.google.com', 'http://staging.google.com')).to.be.false
            expect(behavior.urlsMatch('http://staging.google.com:8080', 'http://staging.google.com:4444')).to.be.false
          })
        })

        describe('and superdomains do not match', () => {
          it('returns false', () => {
            expect(behavior.urlsMatch('https://staging.google.com', 'http://www.yahoo.com')).to.be.false
            expect(behavior.urlsMatch('http://staging.google.com:8080', 'http://staging.yahoo.com:4444')).to.be.false
          })
        })
      })
    })

    describe('shouldInjectDocumentDomain()', () => {
      describe('when param is defined', () => {
        it('returns true', () => {
          expect(behavior.shouldInjectDocumentDomain('http://some.url')).to.be.true
        })
      })

      describe('when param is undefined', () => {
        it('returns false', () => {
          expect(behavior.shouldInjectDocumentDomain(undefined)).to.be.false
        })
      })
    })
  })

  describe('OriginBehavior', () => {
    let behavior: OriginBehavior
    let url: string

    beforeEach(() => {
      url = 'http://some.url.com'
      behavior = new OriginBehavior()
    })

    describe('getOrigin', () => {
      it('returns the .origin returned from URL', () => {
        expect(behavior.getOrigin(url)).to.equal(new URL(url).origin)
      })
    })

    describe('.getHostname', () => {
      it('returns the .hostname returned by URL()', () => {
        expect(behavior.getHostname(url)).to.equal(new URL(url).hostname)
      })
    })

    describe('urlsMatch', () => {
      describe('same superdomain', () => {
        it('returns false', () => {
          expect(behavior.urlsMatch('http://staging.foo.com', 'http://dev.foo.com')).to.be.false
        })
      })

      describe('same hostname', () => {
        it('returns true', () => {
          expect(behavior.urlsMatch('http://staging.foo.com', 'http://staging.foo.com')).to.be.true
        })
      })

      describe('different hostname', () => {
        it('returns false', () => {
          expect(behavior.urlsMatch('http://foo.com', 'http://bar.com')).to.be.false
        })
      })
    })
  })
})
