import _ from 'lodash'
import { knownBrowsers, validateMinVersion } from '../../lib/known-browsers'
import { expect } from 'chai'
import { FoundBrowser } from '@packages/types'
const snapshot = require('snap-shot-it')

describe('browsers', () => {
  it('returns the expected list of browsers', () => {
    snapshot(knownBrowsers)
  })

  // https://github.com/cypress-io/cypress/issues/6669
  it('exports multiline versionRegexes', () => {
    expect(_.every(knownBrowsers.map(({ versionRegex }) => {
      return versionRegex.multiline
    }))).to.be.true
  })

  describe('firefox-stable validator', () => {
    const firefoxBrowser = {
      ...knownBrowsers.find(({ name, channel }) => name === 'firefox' && channel === 'stable'),
      path: '/path/to/firefox',
    }

    context('Windows', () => {
      it('validates against version 101', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '101.1.0',
          majorVersion: '101',
        } as FoundBrowser

        const result = firefoxBrowser.validator(foundBrowser, 'win32')

        expect(result.isSupported).to.be.false
        expect(result.warningMessage).to.contain('Cypress does not support running Firefox version 101 on Windows due to a blocking bug in Firefox.')
      })

      it('validates against version 102', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '102.1.0',
          majorVersion: '102',
          path: '/path/to/firefox',
        } as FoundBrowser

        const result = firefoxBrowser.validator(foundBrowser, 'win32')

        expect(result.isSupported).to.be.false
        expect(result.warningMessage).to.contain('Cypress does not support running Firefox version 102 on Windows due to a blocking bug in Firefox.')
      })

      it('validates against minimum supported version', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '85.1.0',
          majorVersion: '85',
        } as FoundBrowser

        const result = firefoxBrowser.validator(foundBrowser, 'win32')

        expect(result.isSupported).to.be.false
        expect(result.warningMessage).to.contain('Cypress does not support running Firefox version 85.')
      })

      it('successfully validates a version equal to the minimum', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '86.1.0',
          majorVersion: '86',
        } as FoundBrowser

        const result = firefoxBrowser.validator(foundBrowser, 'win32')

        expect(result.isSupported).to.be.true
        expect(result.warningMessage).to.be.undefined
      })

      it('successfully validates a version greater than the minimum', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '103.1.0',
          majorVersion: '103',
        } as FoundBrowser

        const result = firefoxBrowser.validator(foundBrowser, 'win32')

        expect(result.isSupported).to.be.true
        expect(result.warningMessage).to.be.undefined
      })
    })

    context('Not Windows', () => {
      it('validates 101 as supported', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '101.1.0',
          majorVersion: '101',
        } as FoundBrowser

        const result = firefoxBrowser.validator(foundBrowser, 'darwin')

        expect(result.isSupported).to.be.true
        expect(result.warningMessage).to.be.undefined
      })

      it('validates 102 as supported', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '102.2.0',
          majorVersion: '102',
        } as FoundBrowser

        const result = firefoxBrowser.validator(foundBrowser, 'darwin')

        expect(result.isSupported).to.be.true
        expect(result.warningMessage).to.be.undefined
      })
    })
  })

  describe('#validateMinVersion', () => {
    const testBrowser = {
      displayName: 'Test Browser',
      minSupportedVersion: 50,
      path: '/path/to/browser',
    }

    it('validates against minimum supported version', () => {
      const foundBrowser = {
        ...testBrowser,
        version: '40.1.0',
        majorVersion: '40',
      } as FoundBrowser

      const result = validateMinVersion(foundBrowser)

      expect(result.isSupported).to.be.false
      expect(result.warningMessage).to.contain('Cypress does not support running Test Browser version 40.')
    })

    it('successfully validates a version equal to the minimum', () => {
      const foundBrowser = {
        ...testBrowser,
        version: '50.1.0',
        majorVersion: '50',
      } as FoundBrowser

      const result = validateMinVersion(foundBrowser)

      expect(result.isSupported).to.be.true
      expect(result.warningMessage).to.be.undefined
    })

    it('successfully validates a version greater than the minimum', () => {
      const foundBrowser = {
        ...testBrowser,
        version: '90.1.0',
        majorVersion: '90',
      } as FoundBrowser

      const result = validateMinVersion(foundBrowser)

      expect(result.isSupported).to.be.true
      expect(result.warningMessage).to.be.undefined
    })

    it('does not validate with missing minSupportedVersion', () => {
      const foundBrowser = {
        ...testBrowser,
        version: '90.1.0',
      } as FoundBrowser

      const result = validateMinVersion(foundBrowser)

      expect(result.isSupported).to.be.true
      expect(result.warningMessage).to.be.undefined
    })

    it('does not validate with missing majorVersion', () => {
      const foundBrowser = {
        ...testBrowser,
        minSupportedVersion: 90,
        version: '90.1.0',
      } as FoundBrowser

      const result = validateMinVersion(foundBrowser)

      expect(result.isSupported).to.be.true
      expect(result.warningMessage).to.be.undefined
    })
  })
})
