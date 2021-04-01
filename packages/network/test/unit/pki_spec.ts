import { expect } from 'chai'
import { ParsedUrl, PkiUrlMatcher } from '../../lib/pki'

function urlShouldMatch (url: string, matcher: string) {
  let rule = PkiUrlMatcher.buildMatcherRule(matcher)
  let parsedUrl = new ParsedUrl(url)

  expect(PkiUrlMatcher.matchUrl(parsedUrl, rule), `'${url}' should match '${matcher}' (rule: ${JSON.stringify(rule)})`).to.be.true
}

function urlShouldNotMatch (url: string, matcher: string) {
  let rule = PkiUrlMatcher.buildMatcherRule(matcher)
  let parsedUrl = new ParsedUrl(url)

  expect(PkiUrlMatcher.matchUrl(parsedUrl, rule), `'${url}' should not match '${matcher}' (rule: ${JSON.stringify(rule)})`).to.be.false
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
      //expect(parsed.path).to.eq("/*/path/")
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
})
