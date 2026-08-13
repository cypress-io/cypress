/* eslint-disable no-undef */
// gRPC-Web through Cypress: pass-through, spying, and stubbing.
//
// Run against the standalone origin in system-tests/projects/grpc-web-h2:
//
//   node system-tests/projects/grpc-web-h2/server.mjs
//   CYPRESS_INTERNAL_DISABLE_PROXY=1 yarn cypress:run \
//     --project system-tests/projects/grpc-web-h2 --browser chrome
//   yarn cypress:run --project system-tests/projects/grpc-web-h2 \
//     --browser chrome --expose expectedBrowserProtocol=1.1
const expectedBrowserProtocol = Cypress.expose('expectedBrowserProtocol')

// `message Echo { string text = 1; }`
const encodeProto = (text) => {
  const value = new TextEncoder().encode(text)
  const out = new Uint8Array(value.length + 2)

  out[0] = 0x0A
  out[1] = value.length
  out.set(value, 2)

  return out
}

const frame = (flags, payload) => {
  const out = new Uint8Array(payload.length + 5)
  const view = new DataView(out.buffer)

  view.setUint8(0, flags)
  view.setUint32(1, payload.length)
  out.set(payload, 5)

  return out
}

const grpcWebResponse = (message) => {
  const data = frame(0x00, encodeProto(message))
  const trailers = frame(0x80, new TextEncoder().encode('grpc-status:0\r\ngrpc-message:\r\n'))
  const out = new Uint8Array(data.length + trailers.length)

  out.set(data, 0)
  out.set(trailers, data.length)

  return out.buffer
}

const echo = (text, transport) => {
  return cy.window().then((win) => {
    return Cypress.Promise.resolve(win.grpcEcho(text, transport))
  })
}

describe('gRPC-Web', () => {
  it('passes through unintercepted, on the negotiated protocol', () => {
    cy.visit('/')

    cy.get('#error').should('have.text', '')
    cy.get('#fetch-echo').should('have.text', 'echo: hello from fetch')
    cy.get('#xhr-echo').should('have.text', 'echo: hello from xhr')
    cy.get('#fetch-protocol').should('have.text', expectedBrowserProtocol)
  })

  it('can be spied on without corrupting the binary request or response', () => {
    // the page fires its own gRPC-Web calls on load; let those finish and
    // register the spy afterwards so only the call this test drives matches
    cy.visit('/')
    cy.get('#fetch-echo').should('not.have.text', 'pending')
    cy.get('#xhr-echo').should('not.have.text', 'pending')

    cy.intercept('POST', '**/echo.Echo/Say').as('grpc')

    echo('spied call', 'fetch').should('deep.include', { message: 'echo: spied call' })

    // the origin decoded the protobuf it received, so the request body
    // survived the round trip through Cypress byte for byte
    cy.wait('@grpc').then(({ request, response }) => {
      expect(response.headers['content-type']).to.eq('application/grpc-web+proto')
      expect(response.headers['x-echo-request']).to.be.a('string')

      // the response body must still carry both frames: a data frame and the
      // 0x80 trailer frame the client needs to see grpc-status: 0
      const bytes = typeof response.body === 'string'
        ? new TextEncoder().encode(response.body)
        : new Uint8Array(response.body)
      const text = Array.from(bytes).map((b) => String.fromCharCode(b)).join('')

      cy.log(`response.body type: ${Object.prototype.toString.call(response.body)}, ${bytes.length} bytes`)
      cy.log(`request.body type: ${Object.prototype.toString.call(request.body)}`)

      // 5-byte data frame header + 2-byte protobuf header + message, then a
      // 5-byte trailer frame header + the 30-byte trailer block
      const expectedLength = 5 + 2 + 'echo: spied call'.length + 5 + 30

      expect(bytes[0], 'first frame is a data frame').to.eq(0x00)
      expect(text, 'echoed message survives').to.contain('echo: spied call')
      expect(text, 'trailer frame survives').to.contain('grpc-status:0')
      expect(bytes.length, 'response body length is intact').to.eq(expectedLength)

      // the request body the origin decoded — proof the binary protobuf made
      // it upstream regardless of what the intercept handler was shown
      expect(response.headers['x-echo-request']).to.eq('spied call')
    })
  })

  it('shows the intercept handler the whole non-UTF8 request body', () => {
    cy.visit('/')
    cy.get('#fetch-echo').should('not.have.text', 'pending')
    cy.get('#xhr-echo').should('not.have.text', 'pending')

    cy.intercept('POST', '**/echo.Echo/Bytes').as('bytes')

    cy.window().then((win) => {
      return Cypress.Promise.resolve(win.grpcBinary())
    }).then(({ sent, received, hex }) => {
      // whatever the intercept was shown, the origin must still get the bytes
      expect(received, 'origin received every byte the page sent').to.eq(sent)
      expect(hex, 'origin received the invalid-UTF8 tail').to.contain('ff80c328')
    })

    cy.wait('@bytes').then(({ request }) => {
      const bytes = typeof request.body === 'string'
        ? new Uint8Array(Array.from(request.body).map((c) => c.charCodeAt(0)))
        : new Uint8Array(request.body)

      cy.log(`req.body is ${Object.prototype.toString.call(request.body)}, ${bytes.length} bytes`)

      expect(bytes.length, 'req.body carries the full 17-byte request').to.eq(17)
    })
  })

  it('sends a request body rewritten by the intercept handler', () => {
    cy.visit('/')
    cy.get('#fetch-echo').should('not.have.text', 'pending')
    cy.get('#xhr-echo').should('not.have.text', 'pending')

    // an ASCII replacement, so nothing here depends on binary handling
    const replacement = 'REWRITTEN'
    const replacementHex = Array.from(replacement)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')

    cy.intercept('POST', '**/echo.Echo/Bytes', (req) => {
      req.body = replacement
    }).as('bytes')

    cy.window().then((win) => {
      return Cypress.Promise.resolve(win.grpcBinary())
    }).then(({ received, hex }) => {
      expect(hex, 'origin received exactly the rewritten body').to.eq(replacementHex)
      expect(received, 'origin received the rewritten byte count').to.eq(replacement.length)
    })
  })

  it('delivers a server-streaming call progressively', () => {
    cy.visit('/')

    cy.window().then((win) => {
      return Cypress.Promise.resolve(win.grpcStream())
    }).then(({ arrivals }) => {
      const detail = `arrivals (ms): [${arrivals.join(', ')}]`

      cy.log(detail)

      // the origin spaces its three frames 300ms apart, so a streaming client
      // sees the last bytes at least ~600ms after the first. Everything
      // landing at once means the response was buffered before the page saw it
      expect(arrivals.length, `more than one chunk reached the page — ${detail}`).to.be.greaterThan(1)
      expect(arrivals[arrivals.length - 1] - arrivals[0], `spread between first and last chunk — ${detail}`).to.be.greaterThan(400)
    })
  })

  it('can be stubbed with a framed ArrayBuffer body', () => {
    cy.visit('/')
    cy.get('#fetch-echo').should('not.have.text', 'pending')
    cy.get('#xhr-echo').should('not.have.text', 'pending')

    cy.intercept('POST', '**/echo.Echo/Say', {
      headers: { 'content-type': 'application/grpc-web+proto' },
      body: grpcWebResponse('echo: stubbed'),
    }).as('grpc')

    echo('unused', 'fetch').should('deep.include', { message: 'echo: stubbed' })
    echo('unused', 'xhr').should('deep.include', { message: 'echo: stubbed' })
  })
})
