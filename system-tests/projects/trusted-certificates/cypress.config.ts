// Plain object export — dev-mode `--project` resolves `cypress` from the
// project root, so this file must not import from 'cypress'.
//
// `certs/server.crt.pem` is the exact leaf certificate the system-test HTTPS
// server presents (`@packages/https-proxy/test/helpers/certs/server/
// my-server.crt.pem`). Declaring it here passes its SPKI fingerprint to Chrome
// via `--ignore-certificate-errors-spki-list`, so on the browser (CDP) network
// path this self-signed origin is genuinely trusted rather than merely
// tolerated by the blanket `--ignore-certificate-errors`. Chrome matches the
// fingerprint against certs in the chain the server actually presents; that
// server sends only the leaf (no CA, no chain bundle), so the LEAF — not the
// signing CA — is what must be trusted.
export default {
  e2e: {
    supportFile: false,
    baseUrl: 'https://localhost:3232',
  },
  trustedCertificates: [
    { filePath: 'certs/server.crt.pem' },
  ],
}
