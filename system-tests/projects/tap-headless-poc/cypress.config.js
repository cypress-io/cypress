const http = require('http')

const page = (id, label) => `<!DOCTYPE html><html><head><title>${label}</title></head><body><h1 id="${id}">${label}</h1></body></html>`

const startServer = (port, id, label) => {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.end(page(id, label))
  })

  server.listen(port)

  return server
}

module.exports = {
  e2e: {
    baseUrl: 'http://localhost:4621',
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents (on, config) {
      startServer(4621, 'primary', 'Primary origin')
      startServer(4622, 'secondary', 'Secondary origin')

      on('before:browser:launch', (browser, launchOptions) => {
        // Stage 0 of the headless-open PoC: force headless without any
        // Cypress source changes. browser.isHeadless stays false, so the
        // automation extension still loads (headless=new supports it).
        if (process.env.POC_CHROME_HEADLESS_ARG === '1' && browser.family === 'chromium') {
          launchOptions.args.push('--headless=new', '--window-size=1280,720')
        }

        return launchOptions
      })

      return config
    },
  },
}
