// NOTE: plain object export — dev-mode `--project` resolves `cypress` from
// the project root, so this file must not import from 'cypress'.
export default {
  retries: 0,
  allowCypressEnv: false,
  expose: {
    expectedBrowserProtocol: '2.0',
  },
  e2e: {
    baseUrl: 'https://localhost:8444',
    supportFile: false,
    setupNodeEvents (on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args = launchOptions.args.filter((arg) => arg !== '--disable-http2')
          // self-signed fixture cert
          launchOptions.args.push('--ignore-certificate-errors')
        }

        return launchOptions
      })
    },
  },
}
