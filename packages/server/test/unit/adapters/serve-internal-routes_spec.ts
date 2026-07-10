const { expect, sinon } = require('../../spec_helper')

import { isCypressServerOrigin, isInternalCypressRoute } from '../../../lib/adapters/internal-routes'
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
    expect(isInternalCypressRoute('/__cypress-studio/app.js', config)).to.be.true
  })

  it('does not match component-testing bundler assets under the namespace', () => {
    expect(isInternalCypressRoute('/__cypress/src/cypress/support/component.jsx', config)).to.be.false
    expect(isInternalCypressRoute('/__cypress/src/spec-0.js', config)).to.be.false
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
})

describe('lib/adapters/serve-internal-routes', () => {
  function createMiddleware (response: any = {
    statusCode: 200,
    headers: {},
    body: 'ok',
  }) {
    const serverRequest = {
      create: sinon.stub().resolves(response),
    }

    return {
      middleware: createServeInternalRoutesMiddleware({
        config,
        request: serverRequest as any,
      }),
      serverRequest,
    }
  }

  it('delegates non-internal requests to the next middleware', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub().resolves({ id: 'req-1', url: 'https://example.test/app' })
    const terminal = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'https://example.test/app',
    }, next, terminal)

    expect(response).to.deep.equal({ id: 'req-1', url: 'https://example.test/app' })
    expect(next).to.have.been.calledOnce
    expect(terminal).not.to.have.been.called
    expect(serverRequest.create).not.to.have.been.called
  })

  it('delegates component-testing bundler assets to the next middleware', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub().resolves({
      id: 'req-1',
      url: 'http://localhost:5173/__cypress/src/cypress/support/component.jsx',
    })
    const terminal = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:5173/__cypress/src/cypress/support/component.jsx',
    }, next, terminal)

    expect(response.url).to.equal('http://localhost:5173/__cypress/src/cypress/support/component.jsx')
    expect(next).to.have.been.calledOnce
    expect(terminal).not.to.have.been.called
    expect(serverRequest.create).not.to.have.been.called
  })

  it('forwards same-origin internal requests through the next middleware', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub().resolves({ id: 'req-1', url: 'http://localhost:1234/__cypress/xhrs/foo' })
    const terminal = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
    }, next, terminal)

    expect(response).to.deep.equal({ id: 'req-1', url: 'http://localhost:1234/__cypress/xhrs/foo' })
    expect(next).to.have.been.calledOnce
    expect(terminal).not.to.have.been.called
    expect(serverRequest.create).not.to.have.been.called
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
    const terminal = sinon.stub()

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
    }, next, terminal)

    expect(next).not.to.have.been.called
    expect(terminal).not.to.have.been.called
    expect(serverRequest.create).to.have.been.calledOnce
    expect(serverRequest.create).to.have.been.calledWithMatch({
      url: 'http://127.0.0.1:1234/__cypress/process-origin-callback?foo=1',
      proxy: 'http://127.0.0.1:1234',
      method: 'POST',
      headers: {
        cookie: 'session=abc',
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
