/* eslint-disable no-console */
// Standalone dual-stack HTTP/2 origin for verifying browser h2 through
// Cypress with the MITM proxy disabled.
//
// Dual-stack (allowHTTP1: true) mirrors real h2 servers (nginx, CDNs): the
// browser negotiates h2 via ALPN while Cypress's server-side requests
// (cy.visit's resolve:url pre-flight, cy.request) fall back to HTTP/1.1.
// Every response embeds the protocol the server saw, so specs can assert
// exactly which connection spoke h2.
//
// This origin is deliberately NOT hosted by the system-tests harness: the
// harness runs fixture servers in-process over Express, and Node's h1.1
// compat path dies under that arrangement (see #34308). Run it out-of-band:
//
//   node system-tests/projects/http2-dual-stack/server.mjs
import http2 from 'http2'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT) || 8443
const certsDir = path.join(__dirname, 'certs')
const keyPath = path.join(certsDir, 'key.pem')
const certPath = path.join(certsDir, 'cert.pem')

// self-signed certs are generated on demand rather than committed, so they
// can never expire in CI
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  fs.mkdirSync(certsDir, { recursive: true })
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', keyPath, '-out', certPath, '-days', '365',
    '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ])

  console.log('[h2-dual-stack] generated self-signed certs')
}

const server = http2.createSecureServer({
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  allowHTTP1: true,
})

const page = (protocol) => {
  return `<html>
  <head>
    <title>Standalone HTTP/2 Server</title>
  </head>
  <body>
    <h1>Standalone HTTP/2 Server</h1>
    <div>cy.visit() protocol: <span id="visit-protocol">${protocol}</span></div>
    <div>browser traffic protocol: <span id="browser-protocol">pending</span></div>
    <div>number of in-page app API requests: <span id="api-request-count">0</span></div>
    <script>
      fetch('/api/data')
        .then((res) => res.json())
        .then((body) => {
          document.getElementById('browser-protocol').textContent = body.protocol
        })

      let completed = 0

      for (let i = 0; i < 10; i++) {
        fetch('/api/item/' + i)
          .then((res) => res.json())
          .then(() => {
            completed += 1
            document.getElementById('api-request-count').textContent = String(completed)
          })
      }
    </script>
  </body>
</html>`
}

server.on('request', (req, res) => {
  const protocol = req.httpVersion

  console.log(`[h2-dual-stack] HTTP/${protocol} ${req.method} ${req.url}`)

  if (req.url === '/') {
    res.setHeader('content-type', 'text/html')

    return res.end(page(protocol))
  }

  if (req.url === '/api/data') {
    res.setHeader('content-type', 'application/json')

    return res.end(JSON.stringify({ message: 'pong', protocol }))
  }

  if (req.url.startsWith('/api/item/')) {
    res.setHeader('content-type', 'application/json')

    return res.end(JSON.stringify({ id: req.url.split('/').pop(), protocol }))
  }

  res.statusCode = 404
  res.end('not found')
})

server.on('error', (err) => {
  console.error('[h2-dual-stack] server error:', err)
})

server.listen(PORT, () => {
  console.log(`[h2-dual-stack] listening on https://localhost:${PORT} (h2 + http/1.1)`)
})
