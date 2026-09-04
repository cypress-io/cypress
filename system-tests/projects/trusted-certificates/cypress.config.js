// Plain object export — dev-mode `--project` resolves `cypress` from the
// project root, so this file must not import from 'cypress'.
//
// `certs/server.crt.pem` is the exact leaf certificate the system-test HTTPS
// server presents (`@packages/https-proxy/test/helpers/certs/server/
// my-server.crt.pem`). On the browser (CDP) network path Cypress no longer
// passes the blanket `--ignore-certificate-errors`, so this self-signed origin
// only loads because its SPKI fingerprint is trusted here. Chrome matches the
// `--ignore-certificate-errors-spki-list` value against certs in the chain the
// server actually presents; that server sends only the leaf (no CA, no chain
// bundle), so the LEAF — not the signing CA — is what must be trusted.
module.exports = {
  e2e: {
    supportFile: false,
    baseUrl: 'https://localhost:3232',
  },
  trustedCertificates: [
    { filePath: 'certs/server.crt.pem' },
  ],
}
