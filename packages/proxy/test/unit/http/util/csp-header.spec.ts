import { generateCspDirectives, hasCspHeader, parseCspHeaders } from '../../../../lib/http/util/csp-header'

import { expect } from 'chai'

const patchedHeaders = [
  'content-security-policy',
  'Content-Security-Policy',
  'content-security-policy-report-only',
  'Content-Security-Policy-Report-Only',
]

describe('http/util/csp-header', () => {
  describe('hasCspHeader', () => {
    patchedHeaders.forEach((headerName) => {
      it(`should be \`true\` for a CSP header using "${headerName}"`, () => {
        expect(hasCspHeader({
          [`${headerName}`]: 'fake-csp-directive fake-csp-value;',
        }, headerName)).equal(true)
      })

      it(`should be \`true\` for a CSP header using multiple "${headerName}" headers`, () => {
        expect(hasCspHeader({
          [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0;,fake-csp-directive-1 fake-csp-value-1;',
        }, headerName)).equal(true)
      })

      it('should be `false` when a CSP header is not present', () => {
        expect(hasCspHeader({
          'Content-Type': 'fake-content-type',
        }, headerName)).equal(false)
      })
    })
  })

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
