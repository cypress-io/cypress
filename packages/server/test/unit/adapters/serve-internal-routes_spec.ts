const { expect, sinon } = require('../../spec_helper')

import { decodeLoopbackHeader, encodeLoopbackHeader, isCypressServerOrigin, isInternalCypressRoute } from '../../../lib/adapters/internal-routes'
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
  it('matches Cypress internal route prefixes', () => {
    expect(isInternalCypressRoute('/__cypress/xhrs/foo', config)).to.be.true
    expect(isInternalCypressRoute('/__/assets/app.js', config)).to.be.true
    expect(isInternalCypressRoute('/__socket-graphql', config)).to.be.true
  })

  it('does not match component-testing bundler assets under the namespace', () => {
    expect(isInternalCypressRoute('/__cypress/src/cypress/support/component.jsx', config)).to.be.false
    expect(isInternalCypressRoute('/__cypress/src/spec-0.js', config)).to.be.false
  })

  it('does not match studio or cy-prompt module-federation entries', () => {
    // Parent cy-in-cy Express handlers re-enter the proxy for these paths.
    expect(isInternalCypressRoute('/__cypress-studio/app-studio.js', config)).to.be.false
    expect(isInternalCypressRoute('/__cypress-cy-prompt/app.js', config)).to.be.false
  })

  it('does not match internal route lookalikes', () => {
    expect(isInternalCypressRoute('/__cypress-other/foo', config)).to.be.false
    expect(isInternalCypressRoute('/app/__cypress/xhrs/foo', config)).to.be.false
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

  it('round-trips a URL through the token-signed loopback header', () => {
    const url = 'https://cross-origin.test/__cypress/xhrs/foo?bar=1'

    expect(decodeLoopbackHeader(encodeLoopbackHeader(url))).to.eq(url)
  })

  it('rejects loopback header values that lack the per-process token', () => {
    expect(decodeLoopbackHeader('https://attacker.test/__/')).to.be.undefined
    expect(decodeLoopbackHeader('sometoken https://attacker.test/__/')).to.be.undefined
    expect(decodeLoopbackHeader('1')).to.be.undefined
    expect(decodeLoopbackHeader(undefined)).to.be.undefined
    expect(decodeLoopbackHeader(['a', 'b'])).to.be.undefined
  })
})

describe('lib/adapters/serve-internal-routes', () => {
  function createMiddleware (response: any = {
    statusCode: 200,
    headers: {},
    body: 'ok',
  }, middlewareConfig = config) {
    const serverRequest = {
      create: sinon.stub().resolves(response),
    }

    return {
      middleware: createServeInternalRoutesMiddleware({
        config: middlewareConfig,
        request: serverRequest as any,
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
        'x-cypress-internal-loopback': encodeLoopbackHeader('http://localhost:1234/__cypress/xhrs/foo'),
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

  it('returns 404 when a loopback re-enters without an Express handler', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__/unknown',
      headers: {
        'x-cypress-internal-loopback': '1',
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
        'x-cypress-internal-loopback': encodeLoopbackHeader('https://cross-origin.test/__cypress/process-origin-callback?foo=1'),
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
})
