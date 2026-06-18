// NOTE: intentionally does NOT `require('cypress')` so this same config can be
// run both standalone (`npx cypress run`) and against the Cypress monorepo dev
// build (`yarn cypress:run --project ./issue-32956-repro`).
const http = require('http')

// A tiny static server that serves an "opener" page and a "popup" page. The
// popup is opened via window.open in each test, which Chrome/Electron expose
// as an extra browser "target" that Cypress attaches to in a paused state.
const startServer = (port) => {
  const pages = {
    '/opener': '<!doctype html><html><body><h1>opener</h1></body></html>',
    '/popup': '<!doctype html><html><body><h1>popup</h1></body></html>',
  }

  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0]

    res.setHeader('content-type', 'text/html')
    res.end(pages[url] ?? '<!doctype html><html><body><h1>not found</h1></body></html>')
  })

  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}

module.exports = {
  e2e: {
    supportFile: false,
    // keep the timeouts short so a hang is obvious quickly
    defaultCommandTimeout: 4000,
    setupNodeEvents (on, config) {
      startServer(9988)

      return config
    },
  },
}
