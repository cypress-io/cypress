import '../../spec_helper'

import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { spkiFingerprintFromPem, trustedCertificateFingerprints } from '../../../lib/util/spki'

// A self-signed prime256v1 leaf whose SPKI SHA-256 fingerprint (base64) is
// stable. This is the exact format Chrome's --ignore-certificate-errors-spki-list expects.
const LEAF_PEM = `-----BEGIN CERTIFICATE-----
MIIBgjCCASmgAwIBAgIUSHxIteYw9X8VkXmwDjsSuQclP2QwCgYIKoZIzj0EAwIw
FzEVMBMGA1UEAwwMY3lwcmVzcy10ZXN0MB4XDTI2MDkwMzIwMTUyNloXDTM2MDgz
MTIwMTUyNlowFzEVMBMGA1UEAwwMY3lwcmVzcy10ZXN0MFkwEwYHKoZIzj0CAQYI
KoZIzj0DAQcDQgAEr0yzU1aJ1L22d5ZOuB2Dhw/J2ChB51sOwtPK9DIFbOs0ARN9
qVeHk9zaybOoqAp+po53GrAMQmexC0mWNhSqzqNTMFEwHQYDVR0OBBYEFHv26tTd
hBlp0ZoClz5PBrEpdNB2MB8GA1UdIwQYMBaAFHv26tTdhBlp0ZoClz5PBrEpdNB2
MA8GA1UdEwEB/wQFMAMBAf8wCgYIKoZIzj0EAwIDRwAwRAIgJDtTs2uc7ZDOiAkR
TJi2y2KhAJYPi2NBiqvHZcWH6cYCIERHM9dX63O6+Y9c+k6C5JKmjpfudYbiyvsi
89KG3PZe
-----END CERTIFICATE-----
`

const LEAF_FINGERPRINT = 'FATqPodQyOdF/d9ZiS7za/C4uyu1X3a+xiWhG3DF0RY='

describe('lib/util/spki', () => {
  describe('.spkiFingerprintFromPem', () => {
    it('produces a 44-char base64 SHA-256 SPKI fingerprint ending in =', () => {
      const fingerprint = spkiFingerprintFromPem(LEAF_PEM)

      expect(fingerprint).to.eq(LEAF_FINGERPRINT)
      expect(fingerprint).to.have.length(44)
      expect(fingerprint.endsWith('=')).to.be.true
    })

    it('throws on malformed PEM', () => {
      expect(() => spkiFingerprintFromPem('not a cert')).to.throw()
    })
  })

  describe('.trustedCertificateFingerprints', () => {
    let projectRoot: string

    beforeEach(() => {
      projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spki-'))
    })

    afterEach(() => {
      fs.removeSync(projectRoot)
    })

    it('resolves a filePath entry to the same fingerprint as an inline pem', () => {
      fs.writeFileSync(path.join(projectRoot, 'leaf.pem'), LEAF_PEM)

      const fromFile = trustedCertificateFingerprints([{ filePath: 'leaf.pem' }], projectRoot)
      const fromPem = trustedCertificateFingerprints([{ pem: LEAF_PEM }], projectRoot)

      expect(fromFile).to.deep.eq([LEAF_FINGERPRINT])
      expect(fromFile).to.deep.eq(fromPem)
    })

    it('passes through an spki entry untouched', () => {
      const result = trustedCertificateFingerprints([{ spki: LEAF_FINGERPRINT }], projectRoot)

      expect(result).to.deep.eq([LEAF_FINGERPRINT])
    })

    it('dedupes identical fingerprints from different input shapes', () => {
      fs.writeFileSync(path.join(projectRoot, 'leaf.pem'), LEAF_PEM)

      const result = trustedCertificateFingerprints([
        { filePath: 'leaf.pem' },
        { pem: LEAF_PEM },
        { spki: LEAF_FINGERPRINT },
      ], projectRoot)

      expect(result).to.deep.eq([LEAF_FINGERPRINT])
    })

    it('returns an empty array for no entries', () => {
      expect(trustedCertificateFingerprints([], projectRoot)).to.deep.eq([])
    })

    it('throws naming the path when a filePath cannot be read', () => {
      expect(() => trustedCertificateFingerprints([{ filePath: 'missing.pem' }], projectRoot))
      .to.throw(/missing\.pem/)
    })

    it('throws when a pem entry is malformed', () => {
      expect(() => trustedCertificateFingerprints([{ pem: 'garbage' }], projectRoot)).to.throw()
    })
  })
})
