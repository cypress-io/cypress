import fs from 'fs'
import http2 from 'http2'
import path from 'path'
import type { Server } from 'net'

export { generateMtlsCertificates } from '@packages/network/test/helpers/mtls-certs'

const PAGE = `<!doctype html>
<html><body>
  <div data-cy="doc">mTLS document</div>
  <div data-cy="script">pending</div>
  <div data-cy="fetch">pending</div>
  <script src="/peer.js"></script>
  <script>
    fetch('/peer')
      .then((r) => r.json())
      .then((b) => { document.querySelector('[data-cy=fetch]').textContent = b.peerCN })
      .catch((e) => { document.querySelector('[data-cy=fetch]').textContent = 'error: ' + e.message })
  </script>
</body></html>`

/**
 * An HTTP/2 origin that demands a client certificate. Every response reports the CN the
 * handshake actually presented, so a spec assertion fails loudly rather than a request
 * simply never arriving.
 */
export function startMtlsServer (certsDir: string, port: number): Promise<Server> {
  const at = (f: string) => fs.readFileSync(path.join(certsDir, f))

  const server = http2.createSecureServer({
    key: at('origin.key'),
    cert: at('origin.crt'),
    ca: at('client-ca.crt'),
    requestCert: true,
    rejectUnauthorized: true,
    allowHTTP1: true,
    ALPNProtocols: ['h2', 'http/1.1'],
  })

  const respond = (socket: any, pathname: string, send: (status: number, type: string, body: string) => void) => {
    const peerCN = socket.getPeerCertificate()?.subject?.CN ?? null

    if (pathname === '/') return send(200, 'text/html', PAGE)

    if (pathname === '/peer.js') {
      return send(200, 'application/javascript', `document.querySelector('[data-cy=script]').textContent = ${JSON.stringify(peerCN)}`)
    }

    return send(200, 'application/json', JSON.stringify({ peerCN }))
  }

  server.on('stream', (stream, headers) => {
    respond(stream.session!.socket, headers[':path'] as string, (status, type, body) => {
      stream.respond({ ':status': status, 'content-type': type })
      stream.end(body)
    })
  })

  server.on('request', (req, res) => {
    if (req.httpVersionMajor === 2) return

    respond(req.socket, req.url as string, (status, type, body) => {
      res.writeHead(status, { 'content-type': type })
      res.end(body)
    })
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => resolve(server as unknown as Server))
  })
}
