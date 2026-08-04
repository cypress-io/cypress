// NOTE: plain object export — dev-mode `--project` resolves `cypress` from
// the project root, so this file must not import from 'cypress'.
export default {
  retries: 0,
  allowCypressEnv: false,
  // the expected browser protocol is public configuration — the proxy-enabled
  // contrast run overrides it with `--expose expectedBrowserProtocol=1.1`
  expose: {
    expectedBrowserProtocol: '2.0',
  },
  e2e: {
    baseUrl: 'https://localhost:8443',
    supportFile: false,
    setupNodeEvents (on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          // Cypress launches Chrome with --disable-http2 by default (MITM
          // proxy compat) — remove it so the browser can negotiate h2
          launchOptions.args = launchOptions.args.filter((arg) => arg !== '--disable-http2')
          // self-signed fixture cert
          launchOptions.args.push('--ignore-certificate-errors')
        }

        return launchOptions
      })
    },
  },
}
