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

// openssl x509 -in certs/server.crt.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
const EXPECTED_SPKI = 'Oi3WZDLDCXtOxgJNACKQ7vlUJd8ycYf5yumNprfdvVQ='

export default {
  e2e: {
    supportFile: false,
    baseUrl: 'https://localhost:3232',
    // The blanket `--ignore-certificate-errors` alone makes the spec pass even with an
    // empty `trustedCertificates`, so assert the flag itself here: this is the only place
    // the config-to-Chrome-flag path is observable end to end.
    setupNodeEvents (on) {
      on('before:browser:launch', (browser, launchOptions) => {
        const expectedArg = `--ignore-certificate-errors-spki-list=${EXPECTED_SPKI}`

        if (!launchOptions.args.includes(expectedArg)) {
          throw new Error(`Expected Chrome to be launched with ${expectedArg}, got: ${launchOptions.args.join(' ')}`)
        }

        if (!launchOptions.args.includes('--ignore-certificate-errors')) {
          throw new Error(`Expected Chrome to keep --ignore-certificate-errors, got: ${launchOptions.args.join(' ')}`)
        }

        return launchOptions
      })
    },
  },
  trustedCertificates: [
    { filePath: 'certs/server.crt.pem' },
  ],
}
