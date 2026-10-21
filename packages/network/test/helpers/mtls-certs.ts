import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

/**
 * Generates an origin CA + server certificate and a separate client CA + client certificate
 * into `dir`, for tests that need a real mutual-TLS handshake.
 *
 * Generated rather than committed so nothing expires, and so the origin and client chains
 * stay genuinely distinct — an origin under test must reject a connection that presents no
 * certificate.
 */
export function generateMtlsCertificates (dir: string): void {
  fs.mkdirSync(dir, { recursive: true })

  const at = (f: string) => path.join(dir, f)
  const openssl = (args: string[]) => execFileSync('openssl', args, { stdio: 'pipe' })

  fs.writeFileSync(at('san.ext'), 'subjectAltName=DNS:localhost,IP:127.0.0.1\n')

  openssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', at('origin-ca.key'), '-out', at('origin-ca.crt'), '-days', '2', '-subj', '/CN=Cypress mTLS Origin CA'])
  openssl(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', at('origin.key'), '-out', at('origin.csr'), '-subj', '/CN=localhost'])
  openssl(['x509', '-req', '-in', at('origin.csr'), '-CA', at('origin-ca.crt'), '-CAkey', at('origin-ca.key'), '-CAcreateserial', '-out', at('origin.crt'), '-days', '2', '-extfile', at('san.ext')])

  openssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', at('client-ca.key'), '-out', at('client-ca.crt'), '-days', '2', '-subj', '/CN=Cypress mTLS Client CA'])
  openssl(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', at('client.key'), '-out', at('client.csr'), '-subj', '/CN=cypress-client'])
  openssl(['x509', '-req', '-in', at('client.csr'), '-CA', at('client-ca.crt'), '-CAkey', at('client-ca.key'), '-CAcreateserial', '-out', at('client.crt'), '-days', '2'])
}
