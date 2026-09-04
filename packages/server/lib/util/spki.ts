import path from 'path'
import fs from 'fs-extra'
import { X509Certificate, createHash } from 'crypto'

export type TrustedCertificateEntry =
  | { filePath: string }
  | { pem: string }
  | { spki: string }

/**
 * Computes the base64 SHA-256 of a certificate's SubjectPublicKeyInfo (SPKI),
 * which is the exact value Chrome's `--ignore-certificate-errors-spki-list`
 * flag expects. Only the first certificate in a PEM bundle is read; that is
 * the intended behavior, since Chrome matches the list against any certificate
 * in the chain the server presents, so one leaf or CA fingerprint suffices.
 */
export function spkiFingerprintFromPem (pem: string): string {
  const der = new X509Certificate(pem).publicKey.export({ type: 'spki', format: 'der' })

  return createHash('sha256').update(der).digest('base64')
}

/**
 * Maps validated `trustedCertificates` entries to their SPKI fingerprints,
 * reading and parsing certs as needed. A read or parse failure throws an Error
 * naming the offending entry; the caller decides how to surface it. The result
 * is deduped.
 */
export function trustedCertificateFingerprints (entries: TrustedCertificateEntry[], projectRoot: string): string[] {
  const fingerprints = entries.map((entry) => {
    if ('spki' in entry) {
      return entry.spki
    }

    if ('pem' in entry) {
      try {
        return spkiFingerprintFromPem(entry.pem)
      } catch (err: any) {
        throw new Error(`Could not parse the \`pem\` of a \`trustedCertificates\` entry: ${err.message}`)
      }
    }

    const resolved = path.resolve(projectRoot, entry.filePath)
    let pem: string

    try {
      // eslint-disable-next-line no-restricted-syntax
      pem = fs.readFileSync(resolved, 'utf8')
    } catch (err: any) {
      throw new Error(`Could not load the \`trustedCertificates\` certificate at \`${entry.filePath}\`: ${err.message}`)
    }

    try {
      return spkiFingerprintFromPem(pem)
    } catch (err: any) {
      throw new Error(`Could not parse the \`trustedCertificates\` certificate at \`${entry.filePath}\`: ${err.message}`)
    }
  })

  return [...new Set(fingerprints)]
}
