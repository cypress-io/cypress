import crypto from 'crypto'
import http from 'http'
import path from 'path'
import zlib from 'zlib'
import debugModule from 'debug'
import fs from 'fs-extra'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
import { setupStubbedServer, createRoutes, enableCaptureProtocol } from '../lib/serverStub'
import { PROTOCOL_STUB_RESPONSE_BODIES } from '../lib/protocol-stubs/protocolStubResponse'
import type { RecordedResponseBody } from '../lib/protocol-stubs/protocolStubResponseBodies'

const debug = debugModule('cypress:system-tests:response-bodies')

const PORT = 3232
const ORIGIN = `http://localhost:${PORT}`
const MiB = 1024 * 1024

const image = fs.readFileSync(path.join(__dirname, '../projects/e2e/cypress/fixtures/javascript-logo.png'))
const font = fs.readFileSync(path.join(__dirname, '../projects/protocol/cypress/fixtures/font-flooding.woff2'))
const stylesheet = Buffer.from(`
@font-face {
  font-family: "ResponseBodies";
  src: url("/font.woff2") format("woff2");
}

body {
  font-family: "ResponseBodies";
}
`)
const json = Buffer.from(JSON.stringify({ name: 'Avery Lindqvist', email: 'avery.lindqvist@example.com' }))
// Larger than the 10 MiB capture cap for bodies with no content-length, with a pattern that makes a truncated or
// reordered body show up as a hash mismatch.
const large = Buffer.from(Uint8Array.from({ length: 12 * MiB }, (_byte, index) => index % 251))

const page = Buffer.from(`<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/stylesheet.css">
  </head>
  <body>
    <p>Response bodies</p>
    <script>
      const imageLoaded = new Promise((resolve, reject) => {
        const img = new Image()

        img.onload = () => resolve(true)
        img.onerror = reject
        img.src = '/image.png'
        document.body.appendChild(img)
      })

      const stylesheetLoaded = new Promise((resolve) => {
        if (document.styleSheets.length) {
          resolve(true)
        } else {
          window.addEventListener('load', () => resolve(true))
        }
      })

      Promise.all([
        imageLoaded,
        document.fonts.load('16px "ResponseBodies"').then((faces) => faces.length > 0),
        stylesheetLoaded,
        fetch('/data.json').then((res) => res.json()),
        fetch('/empty').then((res) => res.arrayBuffer()).then((body) => body.byteLength),
        fetch('/large.bin').then((res) => res.arrayBuffer()).then((body) => body.byteLength),
      ]).then(([image, font, stylesheet, json, emptyBytes, largeBytes]) => {
        window.assetsLoaded = { image, font, stylesheet, json, emptyBytes, largeBytes }
      })
    </script>
  </body>
</html>
`)

type Asset = {
  body: Buffer
  contentType: string
  gzip?: boolean
}

const assets: Record<string, Asset> = {
  '/response-bodies.html': { body: page, contentType: 'text/html' },
  '/image.png': { body: image, contentType: 'image/png' },
  '/font.woff2': { body: font, contentType: 'font/woff2' },
  '/stylesheet.css': { body: stylesheet, contentType: 'text/css' },
  '/data.json': { body: json, contentType: 'application/json', gzip: true },
  '/empty': { body: Buffer.alloc(0), contentType: 'application/octet-stream' },
  '/large.bin': { body: large, contentType: 'application/octet-stream' },
}

// Every asset carries an exact content-length, which is what decides between
// reading the body in full and streaming it.
const assetServer = http.createServer((req, res) => {
  const asset = assets[req.url ?? '']

  if (!asset) {
    res.writeHead(404).end()

    return
  }

  const body = asset.gzip ? zlib.gzipSync(asset.body) : asset.body

  res.writeHead(200, {
    'content-type': asset.contentType,
    'content-length': body.length,
    'cache-control': 'no-store',
    ...(asset.gzip ? { 'content-encoding': 'gzip' } : {}),
  })

  res.end(body)
})

const sha256 = (body: Buffer) => crypto.createHash('sha256').update(body).digest('hex')

const getDbPath = () => {
  return path.join(Fixtures.projectPath('protocol'), 'cypress', 'system-tests-protocol-dbs', 'e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db.json')
}

const recordedFor = (recorded: RecordedResponseBody[], pathname: string) => {
  const matches = recorded.filter((entry) => entry.url === `${ORIGIN}${pathname}`)

  expect(matches, `${pathname} is recorded once: ${JSON.stringify(matches)}`).to.have.length(1)

  return matches[0]
}

// The force-http1 jobs export this, which puts chrome on the HTTP/1 proxy
// instead of the CDP capture pump.
const forceHttp1 = process.env.CYPRESS_forceHttp1 === 'true'

const expectCapturedBody = (recorded: RecordedResponseBody[], pathname: string) => {
  const entry = recordedFor(recorded, pathname)
  const expected = assets[pathname].body
  const summary = JSON.stringify(entry)

  if (forceHttp1 && expected.length === 0) {
    expect(entry.kind, summary).to.equal('emptyBody')

    return
  }

  expect(entry.kind, summary).to.equal('stream')

  if (!forceHttp1) {
    // Only the capture pump hands Replay already-decoded bytes; a body read in
    // full arrives with this false, and would leave the pump untested.
    expect(entry.isAlreadyGunzipped, summary).to.be.true
  }

  expect(entry.error, summary).to.be.undefined
  expect(entry.ended, summary).to.be.true
  expect(entry.decodedBytes, summary).to.equal(expected.length)
  expect(entry.decodedSha256, summary).to.equal(sha256(expected))
}

describe('capture-protocol', () => {
  setupStubbedServer(createRoutes())
  enableCaptureProtocol(PROTOCOL_STUB_RESPONSE_BODIES)

  before((done) => {
    assetServer.listen(PORT, done)
  })

  after((done) => {
    assetServer.close(done)
  })

  // Chrome only: Electron's requests don't take the CDP Fetch path, so its
  // bodies never reach the capture pump this spec exists to check.
  describe('response bodies', () => {
    it('records the body of every streamed response - chrome', function () {
      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'protocol',
        spec: 'response-bodies.cy.ts',
        record: true,
        expectedExitCode: 0,
        port: 2121,
        browser: 'chrome',
      }).then(async () => {
        const { recorded }: { recorded: RecordedResponseBody[] } = await fs.readJson(getDbPath())

        debug('recorded response bodies: %O', recorded)

        // A body with a content-length is recorded in full, however large;
        // the capture cap only applies to bodies that may never end.
        for (const pathname of ['/image.png', '/font.woff2', '/stylesheet.css', '/data.json', '/large.bin', '/empty']) {
          expectCapturedBody(recorded, pathname)
        }
      })
    })
  })
})
