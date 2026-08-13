/* eslint-disable no-console */
// Standalone dual-stack HTTP/2 gRPC-Web origin, used to evaluate whether
// gRPC-Web traffic survives Cypress — both as pass-through and under
// cy.intercept — with the MITM proxy enabled and disabled.
//
// gRPC-Web is deliberately the shape under test rather than native gRPC:
// native gRPC needs HTTP trailers, which no browser exposes to JavaScript, so
// browser apps always speak gRPC-Web. The wire format is still binary and
// still carries its status in a trailer FRAME, which is what makes it a
// stress test for an interception layer.
//
// Frame layout (https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md):
//   byte 0     flags — 0x00 data frame, 0x80 trailer frame
//   bytes 1-4  payload length, big endian
//   bytes 5..  payload (protobuf for data, `k:v\r\n` text for trailers)
//
// Run it out-of-band, like system-tests/projects/http2-dual-stack:
//
//   node system-tests/projects/grpc-web-h2/server.mjs
import http2 from 'http2'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT) || 8444
const certsDir = path.join(__dirname, 'certs')
const keyPath = path.join(certsDir, 'key.pem')
const certPath = path.join(certsDir, 'cert.pem')

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  fs.mkdirSync(certsDir, { recursive: true })
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', keyPath, '-out', certPath, '-days', '365',
    '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ])

  console.log('[grpc-web] generated self-signed certs')
}

// --- minimal protobuf codec for `message Echo { string text = 1; }` ---------

const encodeProto = (text) => {
  const value = Buffer.from(text, 'utf8')
  const header = Buffer.from([0x0A, value.length])

  return Buffer.concat([header, value])
}

const decodeProto = (buf) => {
  if (buf.length < 2 || buf[0] !== 0x0A) {
    throw new Error(`not an Echo message: ${buf.toString('hex')}`)
  }

  return buf.subarray(2, 2 + buf[1]).toString('utf8')
}

// --- gRPC-Web framing ------------------------------------------------------

const frame = (flags, payload) => {
  const header = Buffer.alloc(5)

  header.writeUInt8(flags, 0)
  header.writeUInt32BE(payload.length, 1)

  return Buffer.concat([header, payload])
}

const grpcWebResponse = (message) => {
  return Buffer.concat([
    frame(0x00, encodeProto(message)),
    frame(0x80, Buffer.from('grpc-status:0\r\ngrpc-message:\r\n', 'utf8')),
  ])
}

const readBody = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const server = http2.createSecureServer({
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  allowHTTP1: true,
})

const page = (protocol) => {
  return `<html>
  <head><title>gRPC-Web over HTTP/2</title></head>
  <body>
    <h1>gRPC-Web over HTTP/2</h1>
    <div>cy.visit() protocol: <span id="visit-protocol">${protocol}</span></div>
    <div>fetch echo: <span id="fetch-echo">pending</span></div>
    <div>fetch protocol: <span id="fetch-protocol">pending</span></div>
    <div>xhr echo: <span id="xhr-echo">pending</span></div>
    <div>error: <span id="error"></span></div>
    <script>
      const encodeProto = (text) => {
        const value = new TextEncoder().encode(text)
        const out = new Uint8Array(value.length + 2)

        out[0] = 0x0A
        out[1] = value.length
        out.set(value, 2)

        return out
      }

      const decodeProto = (bytes) => {
        if (bytes.length < 2 || bytes[0] !== 0x0A) {
          throw new Error('not an Echo message: ' + Array.from(bytes).join(','))
        }

        return new TextDecoder().decode(bytes.subarray(2, 2 + bytes[1]))
      }

      const frame = (flags, payload) => {
        const out = new Uint8Array(payload.length + 5)
        const view = new DataView(out.buffer)

        view.setUint8(0, flags)
        view.setUint32(1, payload.length)
        out.set(payload, 5)

        return out
      }

      // Decode a gRPC-Web response the way grpc-web / @improbable-eng do:
      // walk the frames, take the data frame as the message and require the
      // trailer frame to report grpc-status 0.
      const decodeGrpcWeb = (bytes) => {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        let offset = 0
        let message = null
        let trailers = null

        while (offset < bytes.length) {
          const flags = view.getUint8(offset)
          const length = view.getUint32(offset + 1)
          const payload = bytes.subarray(offset + 5, offset + 5 + length)

          if (length > bytes.length - offset - 5) {
            throw new Error('truncated frame: declared ' + length + ', have ' + (bytes.length - offset - 5))
          }

          if (flags & 0x80) {
            trailers = new TextDecoder().decode(payload)
          } else {
            message = decodeProto(payload)
          }

          offset += 5 + length
        }

        if (trailers === null) {
          throw new Error('no trailer frame in response')
        }

        if (!/grpc-status: ?0/.test(trailers)) {
          throw new Error('bad trailers: ' + JSON.stringify(trailers))
        }

        return message
      }

      const grpcHeaders = {
        'content-type': 'application/grpc-web+proto',
        'x-grpc-web': '1',
      }

      const show = (id, value) => {
        document.getElementById(id).textContent = value
      }

      const fail = (where, err) => {
        show('error', where + ': ' + err.message)
      }

      const echoViaFetch = (text) => {
        return fetch('/echo.Echo/Say', {
          method: 'POST',
          headers: grpcHeaders,
          body: frame(0x00, encodeProto(text)),
        }).then(async (res) => {
          return {
            message: decodeGrpcWeb(new Uint8Array(await res.arrayBuffer())),
            protocol: res.headers.get('x-origin-protocol') || 'unknown',
            echoedRequest: res.headers.get('x-echo-request') || 'unknown',
          }
        })
      }

      const echoViaXhr = (text) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.open('POST', '/echo.Echo/Say')
          xhr.responseType = 'arraybuffer'
          Object.entries(grpcHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v))
          xhr.onload = () => {
            try {
              resolve({
                message: decodeGrpcWeb(new Uint8Array(xhr.response)),
                protocol: xhr.getResponseHeader('x-origin-protocol') || 'unknown',
                echoedRequest: xhr.getResponseHeader('x-echo-request') || 'unknown',
              })
            } catch (err) {
              reject(err)
            }
          }

          xhr.onerror = () => reject(new Error('network error'))
          xhr.send(frame(0x00, encodeProto(text)))
        })
      }

      // exposed so specs can drive a call after registering cy.intercept
      window.grpcEcho = (text, transport) => {
        return transport === 'xhr' ? echoViaXhr(text) : echoViaFetch(text)
      }

      window.jsonPost = (payload) => {
        return fetch('/api/json', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((res) => res.json())
      }

      window.textPost = (text) => {
        return fetch('/api/json', {
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          body: text,
        }).then((res) => res.json())
      }

      // real protobuf routinely contains bytes that are not valid UTF-8;
      // 0xFF 0x80 0xC3 0x28 is an unambiguously invalid sequence
      window.grpcBinaryBody = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x0C,
        0x0A, 0x05, 104, 101, 108, 108, 111,
        0x10, 0xFF, 0x80, 0xC3, 0x28,
      ])

      window.grpcBinary = () => {
        return fetch('/echo.Echo/Bytes', {
          method: 'POST',
          headers: grpcHeaders,
          body: window.grpcBinaryBody,
        }).then((res) => ({
          sent: window.grpcBinaryBody.length,
          received: Number(res.headers.get('x-received-bytes')),
          hex: res.headers.get('x-received-hex'),
        }))
      }

      // reads the server-streaming call frame by frame, recording when each
      // chunk of bytes actually reached the page
      window.grpcStream = async () => {
        const started = performance.now()
        const res = await fetch('/echo.Echo/Stream', {
          method: 'POST',
          headers: grpcHeaders,
          body: frame(0x00, encodeProto('stream please')),
        })

        const reader = res.body.getReader()
        const arrivals = []

        for (;;) {
          const { done } = await reader.read()

          if (done) break

          arrivals.push(Math.round(performance.now() - started))
        }

        return { arrivals, chunks: arrivals.length }
      }

      echoViaFetch('hello from fetch')
        .then(({ message, protocol }) => {
          show('fetch-echo', message)
          show('fetch-protocol', protocol)
        })
        .catch((err) => fail('fetch', err))

      echoViaXhr('hello from xhr')
        .then(({ message }) => show('xhr-echo', message))
        .catch((err) => fail('xhr', err))
    </script>
  </body>
</html>`
}

server.on('request', async (req, res) => {
  const protocol = req.httpVersion

  console.log(`[grpc-web] HTTP/${protocol} ${req.method} ${req.url} content-type=${req.headers['content-type'] || '-'}`)

  if (req.url === '/') {
    res.setHeader('content-type', 'text/html')

    return res.end(page(protocol))
  }

  if (req.url === '/echo.Echo/Say') {
    const body = await readBody(req)

    let request

    try {
      request = decodeProto(body.subarray(5))
    } catch (err) {
      console.log(`[grpc-web] undecodable request body (${body.length} bytes): ${body.toString('hex')}`)
      res.statusCode = 400
      res.setHeader('content-type', 'text/plain')

      return res.end(`bad grpc-web request: ${err.message}`)
    }

    console.log(`[grpc-web] echo request: ${JSON.stringify(request)} (${body.length} bytes on the wire)`)

    res.setHeader('content-type', 'application/grpc-web+proto')
    res.setHeader('x-origin-protocol', protocol)
    res.setHeader('x-echo-request', request)

    return res.end(grpcWebResponse(`echo: ${request}`))
  }

  // an ordinary JSON endpoint — nothing gRPC about it — echoing back exactly
  // what arrived, so a spec can compare it against what it asked to send
  if (req.url === '/api/json') {
    const body = await readBody(req)

    console.log(`[grpc-web] json request: ${body.length} bytes ${JSON.stringify(body.toString('utf8'))}`)

    res.setHeader('content-type', 'application/json')
    res.setHeader('x-received-bytes', String(body.length))

    return res.end(JSON.stringify({ received: body.toString('utf8') }))
  }

  // a request body that is deliberately not valid UTF-8, echoing back exactly
  // what arrived so a spec can compare it against what the intercept saw
  if (req.url === '/echo.Echo/Bytes') {
    const body = await readBody(req)

    console.log(`[grpc-web] binary request: ${body.length} bytes ${body.toString('hex')}`)

    res.setHeader('content-type', 'application/grpc-web+proto')
    res.setHeader('x-received-bytes', String(body.length))
    res.setHeader('x-received-hex', body.toString('hex'))

    return res.end(grpcWebResponse('ok'))
  }

  // server-streaming: three data frames spaced out in time, then trailers.
  // A client that sees them arrive spread out is genuinely streaming; a
  // client that sees them all at once had the response buffered for it.
  if (req.url === '/echo.Echo/Stream') {
    await readBody(req)

    console.log(`[grpc-web] stream request on HTTP/${protocol}`)

    res.setHeader('content-type', 'application/grpc-web+proto')
    res.setHeader('x-origin-protocol', protocol)

    for (let i = 0; i < 3; i++) {
      res.write(frame(0x00, encodeProto(`chunk ${i}`)))
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    return res.end(frame(0x80, Buffer.from('grpc-status:0\r\ngrpc-message:\r\n', 'utf8')))
  }

  res.statusCode = 404
  res.end('not found')
})

server.on('error', (err) => {
  console.error('[grpc-web] server error:', err)
})

server.listen(PORT, () => {
  console.log(`[grpc-web] listening on https://localhost:${PORT} (h2 + http/1.1)`)
})
