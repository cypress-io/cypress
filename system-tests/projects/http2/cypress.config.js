const { defineConfig } = require('cypress')

module.exports = defineConfig({
  allowCypressEnv: false,
  retries: 0,
  e2e: {
    baseUrl: 'https://www.h2test.local:44700',
    setupNodeEvents (on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args = launchOptions.args.filter((arg) => arg !== '--disable-http2')

          if (process.env.CYPRESS_INTERNAL_DISABLE_PROXY === '1') {
            launchOptions.args.push('--ignore-certificate-errors')
          }
        }

        return launchOptions
      })
    },
  },
})
