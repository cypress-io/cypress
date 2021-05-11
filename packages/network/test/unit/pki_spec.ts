import { expect } from 'chai'
import { ParsedUrl, UrlMatcher, UrlClientCertificates, ClientCertificateStore, ClientCertificates } from '../../lib/pki'
import { parse } from 'url'

function urlShouldMatch (url: string, matcher: string) {
  let rule = UrlMatcher.buildMatcherRule(matcher)
  let parsedUrl = new ParsedUrl(url)

  expect(UrlMatcher.matchUrl(parsedUrl, rule), `'${url}' should match '${matcher}' (rule: ${JSON.stringify(rule)})`).to.be.true
}

function urlShouldNotMatch (url: string, matcher: string) {
  let rule = UrlMatcher.buildMatcherRule(matcher)
  let parsedUrl = new ParsedUrl(url)

  expect(UrlMatcher.matchUrl(parsedUrl, rule), `'${url}' should not match '${matcher}' (rule: ${JSON.stringify(rule)})`).to.be.false
}

function checkParsed (parsed: ParsedUrl, host: string, path: string | undefined, port: number | undefined) {
  expect(parsed.host, `'host ${parsed.host}' should be '${host}'`).to.eq(host)
  expect(parsed.path, `'path ${parsed.path}' should be '${path}'`).to.eq(path)
  expect(parsed.port, `'port ${parsed.port}' should be '${port}'`).to.eq(port)
}

describe('lib/pki', () => {
  context('ParsedUrl', () => {
    it('parses clean URLs', () => {
      let parsed = new ParsedUrl('https://a.host.com')

      checkParsed(parsed, 'a.host.com', undefined, undefined)

      parsed = new ParsedUrl('https://a.host.com:1234')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.port).to.eq(1234)

      parsed = new ParsedUrl('https://a.host.com/a/path/')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.path).to.eq('/a/path/')
    })

    it('parses wildcard URLs', () => {
      let parsed = new ParsedUrl('https://a.host.*')

      expect(parsed.host).to.eq('a.host.*')
      //expect(parsed.host).to.be.empty

      parsed = new ParsedUrl('https://*.host.com')
      expect(parsed.host).to.eq('*.host.com')

      parsed = new ParsedUrl('https://a.host.com/a/path/*')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.path).to.eq('/a/path/*')

      parsed = new ParsedUrl('https://a.host.com/*/path/')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.path).to.eq('/*/path/')

      parsed = new ParsedUrl('*')
      expect(parsed.host).to.eq('*')
      expect(parsed.path).to.eq(undefined)
    })
  })

  context('PkiUrlMatcher', () => {
    it('matches basic hostnames', () => {
      let matcher = 'https://a.host.com'

      urlShouldMatch('https://a.host.com', matcher)
      urlShouldMatch('https://a.host.com/a/path', matcher)
      urlShouldNotMatch('https://a.host.co.uk', matcher)
    })

    it('matches wildcard hostnames', () => {
      let matcher1 = 'https://a.host.*'

      urlShouldMatch('https://a.host.com', matcher1)
      urlShouldMatch('https://a.host.com/a/path', matcher1)
      urlShouldMatch('https://a.host.co.uk', matcher1)
      urlShouldNotMatch('https://a.b.host.co.uk', matcher1)

      matcher1 = 'https://a.*.host.*'
      urlShouldNotMatch('https://a.host.com', matcher1)
      urlShouldNotMatch('https://z.a.host.com', matcher1)
      urlShouldMatch('https://a.b.host.com', matcher1)
      urlShouldMatch('https://a.b.c.host.com', matcher1)
      urlShouldMatch('https://a.b.c.host.co.uk', matcher1)

      matcher1 = '*'
      urlShouldMatch('https://a.host.com', matcher1)
      urlShouldMatch('https://a.b.c.d.e.f.host.co.uk', matcher1)
    })
  })

  context('UrlClientCertificates', () => {
    it('constructs, populates default properties', () => {
      let url = 'http://a.host.com/home'
      let certs = new UrlClientCertificates(url)

      expect(certs.url).to.eq(url)
      expect(certs.pathnameLength).to.eq(5)
      expect(certs)
    })
  })

  context('ClientCertificateStore', () => {
    it('adds and retrieves certs for urls', () => {
      const url1 = parse('https://host.com')
      const url2 = parse('https://company.com')
      const store = new ClientCertificateStore()

      expect(store.getCertCount()).to.eq(0)

      let options = store.getClientCertificateAgentOptionsForUrl(url1)

      expect(options).to.eq(null)

      const certs1 = new UrlClientCertificates(url1.href)

      certs1.clientCertificates = new ClientCertificates()
      certs1.clientCertificates.ca.push(Buffer.from([1, 2, 3, 4]))

      const certs2 = new UrlClientCertificates(url2.href)

      certs2.clientCertificates = new ClientCertificates()
      certs2.clientCertificates.ca.push(Buffer.from([4, 3, 2, 1]))

      store.addClientCertificatesForUrl(certs1)
      expect(store.getCertCount()).to.eq(1)

      store.addClientCertificatesForUrl(certs2)
      expect(store.getCertCount()).to.eq(2)

      const act = () => {
        store.addClientCertificatesForUrl(certs2)
      }

      expect(act).to.throw('ClientCertificateStore::addClientCertificatesForUrl: Url https://company.com/ already in store')

      const options1 = store.getClientCertificateAgentOptionsForUrl(url1)
      const options2 = store.getClientCertificateAgentOptionsForUrl(url2)

      expect(options1.ca).to.eq(certs1.clientCertificates.ca)
      expect(options2.ca).to.eq(certs2.clientCertificates.ca)
    })
  })
})
