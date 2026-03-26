const http = require('http')

/**
 * Chrome does not mirror page console.log to the Node process stderr the way Electron
 * did with ELECTRON_ENABLE_LOGGING. This fixture starts a loopback server that receives
 * log lines and writes them to stderr so system tests can assert on hook order.
 * Synchronous XHR keeps ordering correct even when logs run in the same turn as Cypress.stop().
 */
module.exports = {
  allowCypressEnv: false,
  e2e: {
    async setupNodeEvents (on, config) {
      const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        res.setHeader('Access-Control-Allow-Private-Network', 'true')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()

          return
        }

        if (req.method === 'POST' && req.url === '/log') {
          const chunks = []

          req.on('data', (chunk) => chunks.push(chunk))
          req.on('end', () => {
            const line = Buffer.concat(chunks).toString('utf8')

            process.stderr.write(`${line}\n`)
            res.end()
          })

          return
        }

        res.statusCode = 404
        res.end()
      })

      await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
          server.off('error', reject)
          resolve()
        })
      })

      const { port } = server.address()

      // `env` is not sent to the browser when allowCypressEnv is false (HtmlDataSource); use expose.
      config.expose = { ...(config.expose || {}), SYNC_STDERR_LOG_PORT: port }

      on('after:run', () => {
        server.close()
      })

      return config
    },
  },
}
