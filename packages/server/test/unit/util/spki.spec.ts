import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { generateSpkiFingerprint, resolveTrustedCertificateFingerprints } from '../../../lib/util/spki'

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

// A second, unrelated self-signed prime256v1 cert, so a bundle of the two has a
// distinct fingerprint per certificate.
const SECOND_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCCATegAwIBAgIUNKUtjQUJLdQ/Zt3rjv5tbJ/nWj4wCgYIKoZIzj0EAwIw
HjEcMBoGA1UEAwwTY3lwcmVzcy10ZXN0LXNlY29uZDAeFw0yNjA5MTExNTU3MDVa
Fw0zNjA5MDgxNTU3MDVaMB4xHDAaBgNVBAMME2N5cHJlc3MtdGVzdC1zZWNvbmQw
WTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQoGHsWRTMCQ9d31qRUzBbO9IgRBXDG
SqquRTf9Hfbe0r4la26w6RS9TobP/2CqhXY2WN4RZV/dhyjAb6vqZHXoo1MwUTAd
BgNVHQ4EFgQUo+MGtH2VLAgnzQE2MbEfIgrhFl4wHwYDVR0jBBgwFoAUo+MGtH2V
LAgnzQE2MbEfIgrhFl4wDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNIADBF
AiEAzvagUZy/LuGQbA8UioJwoG8vYKllvsQcQGrcQOttiHYCIGqBV04NJjbWgZhA
HwkiKPCEXNrdp11z9JK1iztUh/3p
-----END CERTIFICATE-----
`

function thrownBy (fn: () => unknown): any {
  try {
    fn()
  } catch (err) {
    return err
  }

  throw new Error('expected function to throw')
}

const LEAF_FINGERPRINT = 'FATqPodQyOdF/d9ZiS7za/C4uyu1X3a+xiWhG3DF0RY='
const SECOND_FINGERPRINT = 'uH9YgbDZndcCZqx0feO5DCRNOmmMJdOOElQVeoBVdPI='

describe('lib/util/spki', () => {
  describe('.generateSpkiFingerprint', () => {
    it('produces a 44-char base64 SHA-256 SPKI fingerprint ending in =', () => {
      const fingerprint = generateSpkiFingerprint(LEAF_PEM)

      expect(fingerprint).toBe(LEAF_FINGERPRINT)
      expect(fingerprint).toHaveLength(44)
      expect(fingerprint.endsWith('=')).toBe(true)
    })

    it('throws on malformed PEM', () => {
      expect(() => generateSpkiFingerprint('not a cert')).toThrow()
    })
  })

  describe('.resolveTrustedCertificateFingerprints', () => {
    let projectRoot: string

    beforeEach(() => {
      projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spki-'))
    })

    afterEach(() => {
      fs.removeSync(projectRoot)
    })

    it('resolves a filePath entry to the same fingerprint as an inline pem', () => {
      fs.writeFileSync(path.join(projectRoot, 'leaf.pem'), LEAF_PEM)

      const fromFile = resolveTrustedCertificateFingerprints([{ filePath: 'leaf.pem' }], projectRoot)
      const fromPem = resolveTrustedCertificateFingerprints([{ pem: LEAF_PEM }], projectRoot)

      expect(fromFile).toStrictEqual([LEAF_FINGERPRINT])
      expect(fromFile).toStrictEqual(fromPem)
    })

    it('resolves an absolute filePath', () => {
      const absolute = path.join(projectRoot, 'leaf.pem')

      fs.writeFileSync(absolute, LEAF_PEM)

      expect(resolveTrustedCertificateFingerprints([{ filePath: absolute }], os.tmpdir())).toStrictEqual([LEAF_FINGERPRINT])
    })

    it('passes through an spki entry untouched', () => {
      const result = resolveTrustedCertificateFingerprints([{ spki: LEAF_FINGERPRINT }], projectRoot)

      expect(result).toStrictEqual([LEAF_FINGERPRINT])
    })

    it('fingerprints every certificate in a pem bundle', () => {
      const bundle = LEAF_PEM + SECOND_PEM

      fs.writeFileSync(path.join(projectRoot, 'bundle.pem'), bundle)

      const fromFile = resolveTrustedCertificateFingerprints([{ filePath: 'bundle.pem' }], projectRoot)
      const fromPem = resolveTrustedCertificateFingerprints([{ pem: bundle }], projectRoot)

      expect(fromFile).toStrictEqual([LEAF_FINGERPRINT, SECOND_FINGERPRINT])
      expect(fromFile).toStrictEqual(fromPem)
    })

    it('dedupes identical fingerprints from different input shapes', () => {
      fs.writeFileSync(path.join(projectRoot, 'leaf.pem'), LEAF_PEM)

      const result = resolveTrustedCertificateFingerprints([
        { filePath: 'leaf.pem' },
        { pem: LEAF_PEM },
        { spki: LEAF_FINGERPRINT },
      ], projectRoot)

      expect(result).toStrictEqual([LEAF_FINGERPRINT])
    })

    it('returns an empty array for no entries', () => {
      expect(resolveTrustedCertificateFingerprints([], projectRoot)).toStrictEqual([])
    })

    it('throws a Cypress error naming the path when a filePath cannot be read', () => {
      const err = thrownBy(() => resolveTrustedCertificateFingerprints([{ filePath: 'missing.pem' }], projectRoot))

      expect(err.message).toMatch(/missing\.pem/)
      expect(err).toHaveProperty('isCypressErr', true)
    })

    it('throws a Cypress error naming the entry when a pem is malformed', () => {
      const err = thrownBy(() => resolveTrustedCertificateFingerprints([{ pem: 'garbage' }], projectRoot))

      expect(err.message).toMatch(/trustedCertificates\[0\]\.pem/)
      expect(err).toHaveProperty('isCypressErr', true)
    })
  })
})
