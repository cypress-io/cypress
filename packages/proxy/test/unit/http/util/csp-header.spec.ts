import { generateCspDirectives, parseCspHeaders } from '../../../../lib/http/util/csp-header'

import { expect } from 'chai'

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

        expect(policyArray.length).to.equal(1)
        policyArray.forEach((policyMap) => {
          expect(policyMap.get('fake-csp-directive')).to.have.members(['fake-csp-value'])
        }, headerName)
      })

      it(`should parse a CSP header using multiple "${headerName}" headers`, () => {
        const policyArray = parseCspHeaders({
          'Content-Type': 'fake-content-type',
          [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0,fake-csp-directive-1 fake-csp-value-1',
        }, headerName)

        expect(policyArray.length).to.equal(2)
        policyArray.forEach((policyMap, idx) => {
          expect(policyMap.get(`fake-csp-directive-${idx}`)).to.have.members([`fake-csp-value-${idx}`])
        }, headerName)
      })

      it(`should strip a CSP header of all directives specified in the "excludeDirectives" argument for single "${headerName}" headers`, () => {
        const policyArray = parseCspHeaders({
          'Content-Type': 'fake-content-type',
          [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0;fake-csp-directive-1 fake-csp-value-1',
        }, headerName, ['fake-csp-directive-0'])

        expect(policyArray.length).to.equal(1)
        policyArray.forEach((policyMap) => {
          expect(policyMap.has(`fake-csp-directive-0`)).to.equal(false)
          expect(policyMap.get(`fake-csp-directive-1`)).to.have.members([`fake-csp-value-1`])
        })
      })

      it(`should strip a CSP header of all directives specified in the "excludeDirectives" argument for multiple "${headerName}" headers`, () => {
        const policyArray = parseCspHeaders({
          'Content-Type': 'fake-content-type',
          [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0,fake-csp-directive-1 fake-csp-value-1',
        }, headerName, ['fake-csp-directive-0'])

        expect(policyArray.length).to.equal(2)
        policyArray.forEach((policyMap, idx) => {
          if (idx === 0) {
            expect(policyMap.has(`fake-csp-directive-0`)).to.equal(false)
          } else {
            expect(policyMap.get(`fake-csp-directive-1`)).to.have.members([`fake-csp-value-1`])
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

              expect(policyArray.length).to.equal(1)
              policyArray.forEach((policyMap) => {
                expect(policyMap.has(directive)).to.equal(true)
                expect(policyMap.get(directive)).to.have.members(value === undefined ? [] : `${value}`.split(' '))
              }, headerName)
            })

            it(`should strip a CSP header using "${headerName}" with a valid "${directive}" directive for "${value}" if the directive is excluded`, () => {
              const policyArray = parseCspHeaders({
                'Content-Type': 'fake-content-type',
                [`${headerName}`]: `${directive}${value === undefined ? '' : ` ${value}`}`,
              }, headerName, [directive])

              expect(policyArray.length).to.equal(1)
              policyArray.forEach((policyMap) => {
                expect(policyMap.has(directive)).to.equal(false)
              }, headerName)
            })
          })
        })
      })
    })
  })

  describe('generateCspDirectives', () => {
    it(`should generate a CSP directive string from a policy map`, () => {
      const policyMap = new Map<string, string[]>()

      policyMap.set('fake-csp-directive', ['\'self\'', 'unsafe-inline', 'fake-csp-value'])
      policyMap.set('default', ['\'self\''])

      expect(generateCspDirectives(policyMap)).equal('fake-csp-directive \'self\' unsafe-inline fake-csp-value; default \'self\'')
    })
  })
})
