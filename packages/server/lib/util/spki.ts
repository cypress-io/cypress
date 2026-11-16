import path from 'path'
import fs from 'fs-extra'
import { X509Certificate, createHash } from 'crypto'
import * as errors from '../errors'

export type TrustedCertificateEntry =
  | { filePath: string }
  | { pem: string }
  | { spki: string }

const CERTIFICATE_BLOCK = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g

/**
 * Computes the base64 SHA-256 of a single certificate's SubjectPublicKeyInfo
 * (SPKI), which is the exact value Chrome's `--ignore-certificate-errors-spki-list`
 * flag expects.
 */
export function generateSpkiFingerprint (pem: string): string {
  const der = new X509Certificate(pem).publicKey.export({ type: 'spki', format: 'der' })

  return createHash('sha256').update(der).digest('base64')
}

/**
 * Fingerprints every certificate in a PEM bundle. Chrome matches the list against
 * any certificate in the chain the server presents, but a bundle can carry several
 * unrelated roots, so trusting only the first would silently drop the rest.
 */
function generateBundleFingerprints (pem: string, label: string): string[] {
  const blocks = pem.match(CERTIFICATE_BLOCK)

  if (!blocks?.length) {
    return errors.throwErr('TRUSTED_CERTIFICATES_LOAD_ERROR', label, new Error('no `-----BEGIN CERTIFICATE-----` block was found'))
  }

  return blocks.map((block) => {
    try {
      return generateSpkiFingerprint(block)
    } catch (err: any) {
      return errors.throwErr('TRUSTED_CERTIFICATES_LOAD_ERROR', label, err)
    }
  })
}

/**
 * Maps validated `trustedCertificates` entries to their SPKI fingerprints,
 * reading and parsing certs as needed. A read or parse failure throws a Cypress
 * error naming the offending entry. The result is deduped.
 */
export function resolveTrustedCertificateFingerprints (entries: TrustedCertificateEntry[], projectRoot: string): string[] {
  const fingerprints = entries.flatMap((entry, i) => {
    if ('spki' in entry) {
      return [entry.spki]
    }

    if ('pem' in entry) {
      return generateBundleFingerprints(entry.pem, `trustedCertificates[${i}].pem`)
    }

    const resolved = path.resolve(projectRoot, entry.filePath)
    let pem: string

    try {
      // eslint-disable-next-line no-restricted-syntax
      pem = fs.readFileSync(resolved, 'utf8')
    } catch (err: any) {
      return errors.throwErr('TRUSTED_CERTIFICATES_LOAD_ERROR', entry.filePath, err)
    }

    return generateBundleFingerprints(pem, entry.filePath)
  })

  return [...new Set(fingerprints)]
}
