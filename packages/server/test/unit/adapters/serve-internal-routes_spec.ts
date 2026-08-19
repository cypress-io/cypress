const { expect, sinon } = require('../../spec_helper')

import { isCypressServerOrigin, isInternalCypressRoute, cypressInternalLoopbackToken } from '../../../lib/adapters/internal-routes'
import { createServeInternalRoutesMiddleware } from '../../../lib/adapters/serve-internal-routes'

const config = {
  clientRoute: '/__/',
  namespace: '__cypress',
  port: 1234,
  proxyUrl: 'http://localhost:1234',
  socketIoRoute: '/__socket',
  devServerPublicPathRoute: '/__cypress/src',
} as any

describe('lib/adapters/internal-routes', () => {
  it('matches Cypress internal route prefixes on both network paths', () => {
    for (const isBrowserNetworkMode of [true, false]) {
      expect(isInternalCypressRoute('/__cypress/xhrs/foo', config, isBrowserNetworkMode)).to.be.true
      expect(isInternalCypressRoute('/__/assets/app.js', config, isBrowserNetworkMode)).to.be.true
      expect(isInternalCypressRoute('/__socket-graphql', config, isBrowserNetworkMode)).to.be.true
    }
  })

  it('does not match component-testing bundler assets under the namespace', () => {
    for (const isBrowserNetworkMode of [true, false]) {
      expect(isInternalCypressRoute('/__cypress/src/cypress/support/component.jsx', config, isBrowserNetworkMode)).to.be.false
      expect(isInternalCypressRoute('/__cypress/src/spec-0.js', config, isBrowserNetworkMode)).to.be.false
    }
  })

  it('matches studio and cy-prompt module-federation entries on the browser (CDP) network path', () => {
    expect(isInternalCypressRoute('/__cypress-studio/app-studio.js', config, true)).to.be.true
    expect(isInternalCypressRoute('/__cypress-cy-prompt/app.js', config, true)).to.be.true
  })

  it('does not match studio or cy-prompt module-federation entries under the MITM proxy', () => {
    // The legacy pipeline already delivers these to Express; looping them back
    // skips later intercept stages and breaks studio.
    expect(isInternalCypressRoute('/__cypress-studio/app-studio.js', config, false)).to.be.false
    expect(isInternalCypressRoute('/__cypress-cy-prompt/app.js', config, false)).to.be.false
  })

  it('does not match internal route lookalikes', () => {
    for (const isBrowserNetworkMode of [true, false]) {
      expect(isInternalCypressRoute('/__cypress-other/foo', config, isBrowserNetworkMode)).to.be.false
      expect(isInternalCypressRoute('/app/__cypress/xhrs/foo', config, isBrowserNetworkMode)).to.be.false
    }
  })

  it('recognizes localhost origins on the Cypress server port', () => {
    expect(isCypressServerOrigin('http://localhost:1234/__cypress/runner/cypress_runner.js', config)).to.be.true
    expect(isCypressServerOrigin('http://127.0.0.1:1234/__cypress/runner/cypress_runner.js', config)).to.be.true
    expect(isCypressServerOrigin('https://example.test/__cypress/runner/cypress_runner.js', config)).to.be.false
  })

  it('falls back to localhost:port when proxyUrl is unset', () => {
    const withoutProxyUrl = { ...config, proxyUrl: undefined }

    expect(isCypressServerOrigin('http://localhost:1234/__/', withoutProxyUrl)).to.be.true
    expect(isCypressServerOrigin('/__/', withoutProxyUrl)).to.be.true
  })
})

describe('lib/adapters/serve-internal-routes', () => {
  afterEach(() => {
    delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT
    delete process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE
    delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
  })

  function createMiddleware (response: any = {
    statusCode: 200,
    headers: {},
    body: 'ok',
  }, middlewareConfig = config, isBrowserNetworkMode = true) {
    const serverRequest = {
      create: sinon.stub().resolves(response),
    }

    return {
      middleware: createServeInternalRoutesMiddleware({
        config: middlewareConfig,
        request: serverRequest as any,
        isBrowserNetworkMode,
      }),
      serverRequest,
    }
  }

  it('delegates non-internal requests to the next middleware', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub().resolves({ id: 'req-1', url: 'https://example.test/app' })

    const response = await middleware({
      id: 'req-1',
      url: 'https://example.test/app',
    }, next)

    expect(response).to.deep.equal({ id: 'req-1', url: 'https://example.test/app' })
    expect(next).to.have.been.calledOnce
    expect(serverRequest.create).not.to.have.been.called
  })

  it('parses path-only URLs when proxyUrl is unset', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 200,
      headers: {},
      body: 'ok',
    }, { ...config, proxyUrl: undefined })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: '/__cypress/xhrs/foo',
      method: 'GET',
    }, next)

    expect(next).not.to.have.been.called
    expect(serverRequest.create).to.have.been.calledWithMatch({
      url: 'http://127.0.0.1:1234/__cypress/xhrs/foo',
    }, true)

    expect(response.statusCode).to.equal(200)
  })

  it('delegates component-testing bundler assets to the next middleware', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub().resolves({
      id: 'req-1',
      url: 'http://localhost:5173/__cypress/src/cypress/support/component.jsx',
    })

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:5173/__cypress/src/cypress/support/component.jsx',
    }, next)

    expect(response.url).to.equal('http://localhost:5173/__cypress/src/cypress/support/component.jsx')
    expect(next).to.have.been.calledOnce
    expect(serverRequest.create).not.to.have.been.called
  })

  it('forwards same-origin internal requests through Express loopback', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
    })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        host: 'localhost:1234',
      },
    }, next)

    expect(next).not.to.have.been.called
    expect(serverRequest.create).to.have.been.calledOnce
    expect(serverRequest.create).to.have.been.calledWithMatch({
      url: 'http://127.0.0.1:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        'x-cypress-internal-loopback': 'http://localhost:1234/__cypress/xhrs/foo',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, true)

    expect(response).to.deep.equal({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
    })
  })

  it('returns 404 when a trusted loopback re-enters without an Express handler', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__/unknown',
      headers: {
        'x-cypress-internal-loopback': 'http://127.0.0.1:1234/__/unknown',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, next)

    expect(next).not.to.have.been.called
    expect(serverRequest.create).not.to.have.been.called
    expect(response).to.deep.equal({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__/unknown',
      statusCode: 404,
      headers: { 'content-type': 'text/plain' },
      body: 'Not Found',
    })
  })

  it('delegates trusted loopback re-entries for cloud-bundle routes to the next middleware', async () => {
    // The cypress-in-cypress parent's Express handlers for studio/cy-prompt
    // re-enter the proxy to forward to the child project — the legacy
    // pipeline must receive the request instead of a loop-guard 404.
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub().resolves({ id: 'req-1', statusCode: 200 })

    await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
      headers: {
        'x-cypress-internal-loopback': 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, next)

    expect(next).to.have.been.calledOnce
    expect(serverRequest.create).not.to.have.been.called
  })

  it('strips the loopback headers from delegated cloud-bundle re-entries', async () => {
    // The token authenticates re-entry — forwarding it to the child project or
    // the AUT would hand a real origin the means to forge a trusted loopback.
    const { middleware } = createMiddleware()
    const next = sinon.stub().resolves({ id: 'req-1', statusCode: 200 })

    await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
      headers: {
        'accept-encoding': 'gzip',
        'x-cypress-internal-loopback': 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, next)

    expect(next.firstCall.args[0].headers).to.deep.equal({ 'accept-encoding': 'gzip' })
  })

  it('does not loop cloud-bundle routes back through Express on the MITM proxy path', async () => {
    // This middleware is installed by both network runtimes. Under MITM the
    // legacy pipeline already delivers studio/cy-prompt to Express, so an
    // Express loopback here would skip the remaining intercept stages.
    const { middleware, serverRequest } = createMiddleware(undefined, config, false)
    const next = sinon.stub().resolves({ id: 'req-1', statusCode: 200 })

    await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
      headers: {},
    }, next)

    expect(next).to.have.been.calledOnce
    expect(serverRequest.create).not.to.have.been.called
  })

  it('does not short-circuit on a spoofed loopback header without the process token', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
    })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      headers: {
        'x-cypress-internal-loopback': 'https://evil.example/__/',
      },
    }, next)

    expect(next).not.to.have.been.called
    expect(serverRequest.create).to.have.been.calledOnce
    expect(response.statusCode).to.equal(200)
  })

  it('loops cross-origin internal requests back to the local Express router', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 201,
      headers: {
        'content-type': 'application/json',
        connection: 'keep-alive',
        'set-cookie': ['a=1'],
      },
      body: Buffer.from('created'),
    })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'https://cross-origin.test/__cypress/process-origin-callback?foo=1',
      method: 'POST',
      headers: {
        cookie: 'session=abc',
        host: 'cross-origin.test',
        connection: 'keep-alive',
      },
      body: '{"file":"spec.cy.ts"}',
    }, next)

    expect(next).not.to.have.been.called
    expect(serverRequest.create).to.have.been.calledOnce
    expect(serverRequest.create).to.have.been.calledWithMatch({
      url: 'http://127.0.0.1:1234/__cypress/process-origin-callback?foo=1',
      method: 'POST',
      headers: {
        cookie: 'session=abc',
        'x-cypress-internal-loopback': 'https://cross-origin.test/__cypress/process-origin-callback?foo=1',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
      body: '{"file":"spec.cy.ts"}',
      encoding: null,
      followRedirect: false,
      gzip: false,
      resolveWithFullResponse: true,
      simple: false,
    }, true)

    expect(response).to.deep.equal({
      id: 'req-1',
      url: 'https://cross-origin.test/__cypress/process-origin-callback?foo=1',
      statusCode: 201,
      headers: {
        'content-type': 'application/json',
        'set-cookie': ['a=1'],
      },
      body: Buffer.from('created'),
    })
  })

  it('asks the loopback for an identity-encoded response in cypress-in-cypress', async () => {
    // The cy-in-cy parent forwards cloud-bundle loopbacks through its proxy
    // pipeline, which rewrites a missing accept-encoding to 'gzip,identity' —
    // and Fetch.fulfillRequest bodies are identity-only, so the loopback must
    // ask for identity explicitly.
    process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT = '1'

    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub()

    await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
    }, next)

    expect(serverRequest.create).to.have.been.calledWithMatch({
      headers: {
        'accept-encoding': 'identity',
      },
    }, true)
  })

  it('sends no accept-encoding on the loopback outside cypress-in-cypress', async () => {
    // Single-hop loopbacks terminate at our own Express routes, which already
    // serve identity when the header is absent.
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub()

    await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
    }, next)

    const headers = serverRequest.create.firstCall.args[0].headers

    expect(headers).not.to.have.property('accept-encoding')
  })

  it('decodes a gzip response body and drops the content-encoding header', async () => {
    const zlib = require('zlib')
    const source = 'export default { StudioPanel: true }'
    const { middleware } = createMiddleware({
      statusCode: 200,
      headers: {
        'content-type': 'application/javascript',
        'content-encoding': 'gzip',
      },
      body: zlib.gzipSync(source),
    })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress-studio/app-studio.js',
      method: 'GET',
    }, next)

    expect(response.headers).to.deep.equal({ 'content-type': 'application/javascript' })
    expect(response.body.toString()).to.equal(source)
  })

  it('drops content-encoding from an empty-body 304 without decoding', async () => {
    const { middleware } = createMiddleware({
      statusCode: 304,
      headers: {
        'content-encoding': 'gzip',
        etag: 'W/"80a-abc"',
      },
      body: Buffer.alloc(0),
    })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress-studio/app-studio.js',
      method: 'GET',
    }, next)

    expect(response.statusCode).to.equal(304)
    // the cached entry being revalidated holds the identity bytes fulfilled
    // earlier, so the refreshed headers must not claim an encoding
    expect(response.headers).to.deep.equal({ etag: 'W/"80a-abc"' })
    expect(response.body.length).to.equal(0)
  })

  describe('cypress-in-cypress inner (CYPRESS_INTERNAL_E2E_TESTING_SELF)', () => {
    // The inner Cypress shares the browser page with the parent — its runner
    // document is the parent's AUT document. Fulfilling own-origin internals
    // here hides the pause from the parent's interception (injection,
    // window:before:load), so the inner must release them to the wire.
    it('releases the own-origin runner document to the next middleware', async () => {
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware()
      const next = sinon.stub().resolves({ id: 'req-1', statusCode: 200 })

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__/',
        method: 'GET',
        resourceType: 'other',
      }, next)

      expect(next).to.have.been.calledOnce
      expect(serverRequest.create).not.to.have.been.called
    })

    it('releases own-origin namespace subresources with concrete types', async () => {
      // the app's graphql calls — the parent's cy.intercept must see these
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware()
      const next = sinon.stub().resolves({ id: 'req-1', statusCode: 200 })

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__cypress/graphql/mutation-foo',
        method: 'POST',
        resourceType: 'xhr',
      }, next)

      expect(next).to.have.been.calledOnce
      expect(serverRequest.create).not.to.have.been.called
    })

    it('still loops own-origin non-clientRoute documents back to Express', async () => {
      // e.g. the CT fixture iframe under /__cypress/iframes — the parent must
      // not get a chance to inject into frames the inner owns outright
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware({
        statusCode: 200,
        headers: {},
        body: 'ok',
      })
      const next = sinon.stub()

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__cypress/iframes/spec',
        method: 'GET',
        resourceType: 'other',
      }, next)

      expect(next).not.to.have.been.called
      expect(serverRequest.create).to.have.been.calledOnce
    })

    it('releases own-origin clientRoute subresources to the next middleware', async () => {
      // matches the e2e-mode topology, where the inner has no interception
      // and the parent's pipeline carries /__/ assets already
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware()
      const next = sinon.stub().resolves({ id: 'req-1', statusCode: 200 })

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__/assets/app.js',
        method: 'GET',
        resourceType: 'script',
      }, next)

      expect(next).to.have.been.calledOnce
      expect(serverRequest.create).not.to.have.been.called
    })

    it('still loops foreign-origin internal requests back to Express', async () => {
      // e.g. internal routes requested on the CT dev-server origin — those
      // never reach our Express over the wire, so the loopback must stay.
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware({
        statusCode: 200,
        headers: {},
        body: 'ok',
      })
      const next = sinon.stub()

      await middleware({
        id: 'req-1',
        url: 'http://localhost:5173/__cypress/xhrs/foo',
        method: 'GET',
        resourceType: 'other',
      }, next)

      expect(next).not.to.have.been.called
      expect(serverRequest.create).to.have.been.calledOnce
    })

    it('keeps the loopback for own-origin internals outside cypress-in-cypress', async () => {
      const { middleware, serverRequest } = createMiddleware({
        statusCode: 200,
        headers: {},
        body: 'ok',
      })
      const next = sinon.stub()

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__/',
        method: 'GET',
      }, next)

      expect(next).not.to.have.been.called
      expect(serverRequest.create).to.have.been.calledOnce
    })
  })
})
