import { describe, expect, it } from 'vitest'
import { generateCspDirectives, parseCspHeaders } from '../../../../lib/http/util/csp-header'

const patchedHeaders = [
  'content-security-policy',
  'Content-Security-Policy',
  'content-security-policy-report-only',
  'Content-Security-Policy-Report-Only',
]

const cspDirectiveValues = {
  'base-uri': ['<source>', '<source> <source>'],
  'block-all-mixed-content': [undefined],
  'child-src': ['<source>', '<source> <source>'],
  'connect-src': ['<source>', '<source> <source>'],
  'default-src': ['<source>', '<source> <source>'],
  'font-src': ['<source>', '<source> <source>'],
  'form-action': ['<source>', '<source> <source>'],
  'frame-ancestors': ['\'none\'', '\'self\'', '<scheme-source>', '<scheme-source> <scheme-source>'],
  'frame-src': ['<source>', '<source> <source>'],
  'img-src': ['<source>', '<source> <source>'],
  'manifest-src': ['<source>', '<source> <source>'],
  'media-src': ['<source>', '<source> <source>'],
  'object-src': ['<source>', '<source> <source>'],
  'plugin-types': ['<type>/<subtype>', '<type>/<subtype> <type>/<subtype>'],
  'prefetch-src': ['<source>', '<source> <source>'],
  'referrer': ['<referrer-policy>'],
  'report-to': ['<json-field-value>'],
  'report-uri': ['<uri>', '<uri> <uri>'],
  'require-trusted-types-for': ['\'script\''],
  'sandbox': [undefined, 'allow-downloads', 'allow-downloads-without-user-activation', 'allow-forms', 'allow-modals', 'allow-orientation-lock', 'allow-pointer-lock', 'allow-popups', 'allow-popups-to-escape-sandbox', 'allow-presentation', 'allow-same-origin', 'allow-scripts', 'allow-storage-access-by-user-activation', 'allow-top-navigation', 'allow-top-navigation-by-user-activation', 'allow-top-navigation-to-custom-protocols'],
  'script-src': ['<source>', '<source> <source>'],
  'script-src-attr': ['<source>', '<source> <source>'],
  'script-src-elem': ['<source>', '<source> <source>'],
  'style-src': ['<source>', '<source> <source>'],
  'style-src-attr': ['<source>', '<source> <source>'],
  'style-src-elem': ['<source>', '<source> <source>'],
  'trusted-types': ['none', '<policyName>', '<policyName> <policyName> \'allow-duplicates\''],
  'upgrade-insecure-requests': [undefined],
  'worker-src': ['<source>', '<source> <source>'],
}

describe('http/util/csp-header', () => {
  describe('parseCspHeader', () => {
    patchedHeaders.forEach((headerName) => {
      it(`should parse a CSP header using "${headerName}"`, () => {
        const policyArray = parseCspHeaders({
          'Content-Type': 'fake-content-type',
          [`${headerName}`]: 'fake-csp-directive fake-csp-value;',
        }, headerName)

        expect(policyArray.length).toEqual(1)
        policyArray.forEach((policyMap) => {
          expect(policyMap.get('fake-csp-directive')).toEqual(['fake-csp-value'])
        }, headerName)
      })

      it(`should parse a CSP header using multiple "${headerName}" headers`, () => {
        const policyArray = parseCspHeaders({
          'Content-Type': 'fake-content-type',
          [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0,fake-csp-directive-1 fake-csp-value-1',
        }, headerName)

        expect(policyArray.length).toEqual(2)
        policyArray.forEach((policyMap, idx) => {
          expect(policyMap.get(`fake-csp-directive-${idx}`)).toEqual([`fake-csp-value-${idx}`])
        }, headerName)
      })

      it(`should strip a CSP header of all directives specified in the "excludeDirectives" argument for single "${headerName}" headers`, () => {
        const policyArray = parseCspHeaders({
          'Content-Type': 'fake-content-type',
          [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0;fake-csp-directive-1 fake-csp-value-1',
        }, headerName, ['fake-csp-directive-0'])

        expect(policyArray.length).toEqual(1)
        policyArray.forEach((policyMap) => {
          expect(policyMap.has(`fake-csp-directive-0`)).toBe(false)
          expect(policyMap.get(`fake-csp-directive-1`)).toEqual([`fake-csp-value-1`])
        })
      })

      it(`should strip a CSP header of all directives specified in the "excludeDirectives" argument for multiple "${headerName}" headers`, () => {
        const policyArray = parseCspHeaders({
          'Content-Type': 'fake-content-type',
          [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0,fake-csp-directive-1 fake-csp-value-1',
        }, headerName, ['fake-csp-directive-0'])

        expect(policyArray.length).toEqual(2)
        policyArray.forEach((policyMap, idx) => {
          if (idx === 0) {
            expect(policyMap.has(`fake-csp-directive-0`)).toBe(false)
          } else {
            expect(policyMap.get(`fake-csp-directive-1`)).toEqual([`fake-csp-value-1`])
          }
        })
      })

      describe(`Valid CSP Directives`, () => {
        Object.entries(cspDirectiveValues).forEach(([directive, values]) => {
          values.forEach((value) => {
            it(`should parse a CSP header using "${headerName}" with a valid "${directive}" directive for "${value}"`, () => {
              const policyArray = parseCspHeaders({
                'Content-Type': 'fake-content-type',
                [`${headerName}`]: `${directive}${value === undefined ? '' : ` ${value}`}`,
              }, headerName)

              expect(policyArray.length).toEqual(1)
              policyArray.forEach((policyMap) => {
                expect(policyMap.has(directive)).toBe(true)
                expect(policyMap.get(directive)).toEqual(value === undefined ? [] : `${value}`.split(' '))
              }, headerName)
            })

            it(`should strip a CSP header using "${headerName}" with a valid "${directive}" directive for "${value}" if the directive is excluded`, () => {
              const policyArray = parseCspHeaders({
                'Content-Type': 'fake-content-type',
                [`${headerName}`]: `${directive}${value === undefined ? '' : ` ${value}`}`,
              }, headerName, [directive])

              expect(policyArray.length).toEqual(1)
              policyArray.forEach((policyMap) => {
                expect(policyMap.has(directive)).toBe(false)
              }, headerName)
            })
          })
        })
      })
    })
  })

  describe('parseCspHeaders output', () => {
    const parse = (header: string, excludeDirectives: string[] = []) => {
      return parseCspHeaders({ 'Content-Security-Policy': header }, 'content-security-policy', excludeDirectives)
      .map((policyMap) => Array.from(policyMap.entries()))
    }

    // Shapes the AUT sends in packages/server/test/integration/http_requests_spec.js
    const callSiteCases: [string, string, string[], [string, string[]][][]][] = [
      ['script-src-elem with a CDN', `object-src 'none'; script-src-elem 'self' https://cdn.example.com`, [], [[
        ['object-src', [`'none'`]],
        ['script-src-elem', [`'self'`, 'https://cdn.example.com']],
      ]]],
      ['trailing semicolon', `object-src 'none'; script-src 'self' https://cdn.example.com;`, [], [[
        ['object-src', [`'none'`]],
        ['script-src', [`'self'`, 'https://cdn.example.com']],
      ]]],
      ['three directives', `object-src 'none'; script-src 'self' https://cdn.example.com; default-src 'self'`, [], [[
        ['object-src', [`'none'`]],
        ['script-src', [`'self'`, 'https://cdn.example.com']],
        ['default-src', [`'self'`]],
      ]]],
      ['stripping the directives response-middleware removes', `object-src 'none'; frame-ancestors 'self'; script-src 'self' https://cdn.example.com; base-uri 'self'`, ['frame-ancestors', 'script-src'], [[
        ['object-src', [`'none'`]],
        ['base-uri', [`'self'`]],
      ]]],
      ['a header set-injection-level already gave a nonce', `script-src 'self' 'nonce-q7TUo5OyZDgtIRWgJbGUHQ=='; default-src 'self'`, [], [[
        ['script-src', [`'self'`, `'nonce-q7TUo5OyZDgtIRWgJbGUHQ=='`]],
        ['default-src', [`'self'`]],
      ]]],
      ['two comma-separated policies', `default-src 'self', script-src https://cdn.example.com`, [], [
        [['default-src', [`'self'`]]],
        [['script-src', ['https://cdn.example.com']]],
      ]],
    ]

    // Inputs that only follow the header's syntax rules, to pin down edge behavior.
    // The line-break rows can't arrive over HTTP and only pin how the parser treats them.
    const formatCases: [string, string, string[], [string, string[]][][]][] = [
      ['an empty header', '', [], []],
      ['only whitespace', '   ', [], [[]]],
      ['only separators', ';; ;\n;', [], [[]]],
      ['a directive with no value', 'upgrade-insecure-requests', [], [[['upgrade-insecure-requests', []]]]],
      ['repeated spaces and leading semicolons', `;;  default-src    'self'   https://a.example.com  ;`, [], [[
        ['default-src', [`'self'`, 'https://a.example.com']],
      ]]],
      ['a repeated directive', `script-src 'self'; script-src https://cdn.example.com`, [], [[
        ['script-src', [`'self'`, 'https://cdn.example.com']],
      ]]],
      ['CRLF and LF line breaks', `default-src 'self'\r\nscript-src https://a.example.com\nhttps://b.example.com`, [], [[
        ['default-src', [`'self'`]],
        ['script-src', ['https://a.example.com']],
        ['https://b.example.com', []],
      ]]],
      ['a tab, which is not a separator', `script-src\t'self'`, [], [[[`script-src\t'self'`, []]]]],
      ['a Windows path', String.raw`report-uri C:\csp\reports; default-src 'self'`, [], [[
        ['report-uri', [String.raw`C:\csp\reports`]],
        ['default-src', [`'self'`]],
      ]]],
    ]

    describe('real call-site shapes', () => {
      it.each(callSiteCases)('parses %s', (_name, header, excludeDirectives, expected) => {
        expect(parse(header, excludeDirectives)).toEqual(expected)
      })
    })

    describe('format edge cases', () => {
      it.each(formatCases)('parses %s', (_name, header, excludeDirectives, expected) => {
        expect(parse(header, excludeDirectives)).toEqual(expected)
      })
    })

    // Both shapes reach the parser intact over HTTP, unlike a line break, which Node's HTTP parser rejects or folds into a space
    describe('adversarial input', () => {
      const parsesQuickly = (header: string, expected: [string, string[]][][]) => {
        const start = performance.now()
        const result = parse(header)
        const elapsed = performance.now() - start

        expect(result).toEqual(expected)
        expect(elapsed).toBeLessThan(200)
      }

      it('parses 25,000 empty directives after a real one in linear time', () => {
        parsesQuickly(`script-src 'self'${'; '.repeat(25_000)}`, [[
          ['script-src', [`'self'`]],
        ]])
      })

      it('parses one directive repeated across a 50,000-character header in linear time', () => {
        parsesQuickly('script-src https://a.example.com;'.repeat(1_516), [[
          ['script-src', Array(1_516).fill('https://a.example.com')],
        ]])
      })
    })
  })

  describe('generateCspDirectives', () => {
    it(`should generate a CSP directive string from a policy map`, () => {
      const policyMap = new Map<string, string[]>()

      policyMap.set('fake-csp-directive', ['\'self\'', 'unsafe-inline', 'fake-csp-value'])
      policyMap.set('default', ['\'self\''])

      expect(generateCspDirectives(policyMap)).toEqual('fake-csp-directive \'self\' unsafe-inline fake-csp-value; default \'self\'')
    })
  })
})
