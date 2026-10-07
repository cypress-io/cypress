import zlib from 'zlib'
import _ from 'lodash'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { isCypressServerOrigin, isInternalCypressRoute, cypressInternalLoopbackToken } from '../../../lib/adapters/internal-routes'
import { createServeInternalRoutesMiddleware } from '../../../lib/adapters/serve-internal-routes'

// sinon's `calledWithMatch` compares objects partially at every depth and
// ignores arguments beyond the ones given.
function expectCalledWithMatch (create: Mock, match: object, flag: unknown) {
  const matched = create.mock.calls.some(([opts, actualFlag]) => _.isEqual(actualFlag, flag) && _.isMatch(opts, match))

  expect(matched, `expected a call matching ${JSON.stringify(match)}, got ${JSON.stringify(create.mock.calls)}`).toBe(true)
}

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
      expect(isInternalCypressRoute('/__cypress/xhrs/foo', config, isBrowserNetworkMode)).toBe(true)
      expect(isInternalCypressRoute('/__/assets/app.js', config, isBrowserNetworkMode)).toBe(true)
      expect(isInternalCypressRoute('/__socket-graphql', config, isBrowserNetworkMode)).toBe(true)
    }
  })

  it('does not match component-testing bundler assets under the namespace', () => {
    for (const isBrowserNetworkMode of [true, false]) {
      expect(isInternalCypressRoute('/__cypress/src/cypress/support/component.jsx', config, isBrowserNetworkMode)).toBe(false)
      expect(isInternalCypressRoute('/__cypress/src/spec-0.js', config, isBrowserNetworkMode)).toBe(false)
    }
  })

  it('matches studio and cy-prompt module-federation entries on the browser (CDP) network path', () => {
    expect(isInternalCypressRoute('/__cypress-studio/app-studio.js', config, true)).toBe(true)
    expect(isInternalCypressRoute('/__cypress-cy-prompt/app.js', config, true)).toBe(true)
  })

  it('matches the studio and cy-prompt sibling namespaces on the browser (CDP) network path', () => {
    expect(isInternalCypressRoute('/__cypress-studio-ai-anon/session', config, true)).toBe(true)
    expect(isInternalCypressRoute('/__cypress-studio-ai-anon/token', config, true)).toBe(true)
    expect(isInternalCypressRoute('/__cypress-studio-ai/generate', config, true)).toBe(true)
    expect(isInternalCypressRoute('/__cypress-cy-prompt-ai/generate', config, true)).toBe(true)
  })

  it('does not match studio or cy-prompt module-federation entries under the MITM proxy', () => {
    // The legacy pipeline already delivers these to Express; looping them back
    // skips later intercept stages and breaks studio.
    expect(isInternalCypressRoute('/__cypress-studio/app-studio.js', config, false)).toBe(false)
    expect(isInternalCypressRoute('/__cypress-studio-ai-anon/session', config, false)).toBe(false)
    expect(isInternalCypressRoute('/__cypress-cy-prompt/app.js', config, false)).toBe(false)
  })

  it('does not match internal route lookalikes', () => {
    for (const isBrowserNetworkMode of [true, false]) {
      expect(isInternalCypressRoute('/__cypress-other/foo', config, isBrowserNetworkMode)).toBe(false)
      expect(isInternalCypressRoute('/app/__cypress/xhrs/foo', config, isBrowserNetworkMode)).toBe(false)
    }
  })

  it('recognizes localhost origins on the Cypress server port', () => {
    expect(isCypressServerOrigin('http://localhost:1234/__cypress/runner/cypress_runner.js', config)).toBe(true)
    expect(isCypressServerOrigin('http://127.0.0.1:1234/__cypress/runner/cypress_runner.js', config)).toBe(true)
    expect(isCypressServerOrigin('https://example.test/__cypress/runner/cypress_runner.js', config)).toBe(false)
  })

  it('falls back to localhost:port when proxyUrl is unset', () => {
    const withoutProxyUrl = { ...config, proxyUrl: undefined }

    expect(isCypressServerOrigin('http://localhost:1234/__/', withoutProxyUrl)).toBe(true)
    expect(isCypressServerOrigin('/__/', withoutProxyUrl)).toBe(true)
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
      create: vi.fn().mockResolvedValue(response),
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
    const next = vi.fn().mockResolvedValue({ id: 'req-1', url: 'https://example.test/app' })

    const response = await middleware({
      id: 'req-1',
      url: 'https://example.test/app',
    }, next)

    expect(response).toStrictEqual({ id: 'req-1', url: 'https://example.test/app' })
    expect(next).toHaveBeenCalledOnce()
    expect(serverRequest.create).not.toHaveBeenCalled()
  })

  it('parses path-only URLs when proxyUrl is unset', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 200,
      headers: {},
      body: 'ok',
    }, { ...config, proxyUrl: undefined })
    const next = vi.fn()

    const response = await middleware({
      id: 'req-1',
      url: '/__cypress/xhrs/foo',
      method: 'GET',
    }, next)

    expect(next).not.toHaveBeenCalled()
    expectCalledWithMatch(serverRequest.create, {
      url: 'http://127.0.0.1:1234/__cypress/xhrs/foo',
    }, true)

    expect(response.statusCode).toBe(200)
  })

  it('delegates component-testing bundler assets to the next middleware', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = vi.fn().mockResolvedValue({
      id: 'req-1',
      url: 'http://localhost:5173/__cypress/src/cypress/support/component.jsx',
    })

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:5173/__cypress/src/cypress/support/component.jsx',
    }, next)

    expect(response.url).toBe('http://localhost:5173/__cypress/src/cypress/support/component.jsx')
    expect(next).toHaveBeenCalledOnce()
    expect(serverRequest.create).not.toHaveBeenCalled()
  })

  it('forwards same-origin internal requests through Express loopback', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
    })
    const next = vi.fn()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        host: 'localhost:1234',
      },
    }, next)

    expect(next).not.toHaveBeenCalled()
    expect(serverRequest.create).toHaveBeenCalledOnce()
    expectCalledWithMatch(serverRequest.create, {
      url: 'http://127.0.0.1:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        'x-cypress-internal-loopback': 'http://localhost:1234/__cypress/xhrs/foo',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, true)

    expect(response).toStrictEqual({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
    })
  })

  it('returns 404 when a trusted loopback re-enters without an Express handler', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = vi.fn()

    const response = await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__/unknown',
      headers: {
        'x-cypress-internal-loopback': 'http://127.0.0.1:1234/__/unknown',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, next)

    expect(next).not.toHaveBeenCalled()
    expect(serverRequest.create).not.toHaveBeenCalled()
    expect(response).toStrictEqual({
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
    const next = vi.fn().mockResolvedValue({ id: 'req-1', statusCode: 200 })

    await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
      headers: {
        'x-cypress-internal-loopback': 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(serverRequest.create).not.toHaveBeenCalled()
  })

  it('strips the loopback headers from delegated cloud-bundle re-entries', async () => {
    // The token authenticates re-entry — forwarding it to the child project or
    // the AUT would hand a real origin the means to forge a trusted loopback.
    const { middleware } = createMiddleware()
    const next = vi.fn().mockResolvedValue({ id: 'req-1', statusCode: 200 })

    await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
      headers: {
        'accept-encoding': 'gzip',
        'x-cypress-internal-loopback': 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
        'x-cypress-internal-loopback-token': cypressInternalLoopbackToken,
      },
    }, next)

    expect(next.mock.calls[0][0].headers).toStrictEqual({ 'accept-encoding': 'gzip' })
  })

  it('does not loop cloud-bundle routes back through Express on the MITM proxy path', async () => {
    // This middleware is installed by both network runtimes. Under MITM the
    // legacy pipeline already delivers studio/cy-prompt to Express, so an
    // Express loopback here would skip the remaining intercept stages.
    const { middleware, serverRequest } = createMiddleware(undefined, config, false)
    const next = vi.fn().mockResolvedValue({ id: 'req-1', statusCode: 200 })

    await middleware({
      id: 'req-1',
      url: 'http://127.0.0.1:1234/__cypress-cy-prompt/driver/cy-prompt.js',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(serverRequest.create).not.toHaveBeenCalled()
  })

  it('does not short-circuit on a spoofed loopback header without the process token', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
    })
    const next = vi.fn()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      headers: {
        'x-cypress-internal-loopback': 'https://evil.example/__/',
      },
    }, next)

    expect(next).not.toHaveBeenCalled()
    expect(serverRequest.create).toHaveBeenCalledOnce()
    expect(response.statusCode).toBe(200)
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
    const next = vi.fn()

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

    expect(next).not.toHaveBeenCalled()
    expect(serverRequest.create).toHaveBeenCalledOnce()
    expectCalledWithMatch(serverRequest.create, {
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

    expect(response).toStrictEqual({
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

  it('loops studio AI requests made from the AUT origin back to the local Express router', async () => {
    const { middleware, serverRequest } = createMiddleware({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: Buffer.from('{"token":"abc"}'),
    })
    const next = vi.fn()

    const response = await middleware({
      id: 'req-1',
      url: 'https://example.cypress.io/__cypress-studio-ai-anon/session',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        host: 'example.cypress.io',
      },
      body: '{}',
    }, next)

    expect(next).not.toHaveBeenCalled()
    expectCalledWithMatch(serverRequest.create, {
      url: 'http://127.0.0.1:1234/__cypress-studio-ai-anon/session',
      method: 'POST',
      body: '{}',
    }, true)

    expect(response.statusCode).toBe(200)
  })

  it('asks the loopback for an identity-encoded response in cypress-in-cypress', async () => {
    // The cy-in-cy parent forwards cloud-bundle loopbacks through its proxy
    // pipeline, which rewrites a missing accept-encoding to 'gzip,identity' —
    // and Fetch.fulfillRequest bodies are identity-only, so the loopback must
    // ask for identity explicitly.
    process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT = '1'

    const { middleware, serverRequest } = createMiddleware()
    const next = vi.fn()

    await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
    }, next)

    expectCalledWithMatch(serverRequest.create, {
      headers: {
        'accept-encoding': 'identity',
      },
    }, true)
  })

  it('sends no accept-encoding on the loopback outside cypress-in-cypress', async () => {
    // Single-hop loopbacks terminate at our own Express routes, which already
    // serve identity when the header is absent.
    const { middleware, serverRequest } = createMiddleware()
    const next = vi.fn()

    await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress/xhrs/foo',
      method: 'GET',
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
    }, next)

    const headers = serverRequest.create.mock.calls[0][0].headers

    expect(headers).not.toHaveProperty(['accept-encoding'])
  })

  it('decodes a gzip response body and drops the content-encoding header', async () => {
    const source = 'export default { StudioPanel: true }'
    const { middleware } = createMiddleware({
      statusCode: 200,
      headers: {
        'content-type': 'application/javascript',
        'content-encoding': 'gzip',
      },
      body: zlib.gzipSync(source),
    })
    const next = vi.fn()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress-studio/app-studio.js',
      method: 'GET',
    }, next)

    expect(response.headers).toStrictEqual({ 'content-type': 'application/javascript' })
    expect(response.body.toString()).toBe(source)
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
    const next = vi.fn()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:1234/__cypress-studio/app-studio.js',
      method: 'GET',
    }, next)

    expect(response.statusCode).toBe(304)
    // the cached entry being revalidated holds the identity bytes fulfilled
    // earlier, so the refreshed headers must not claim an encoding
    expect(response.headers).toStrictEqual({ etag: 'W/"80a-abc"' })
    expect(response.body.length).toBe(0)
  })

  describe('cypress-in-cypress inner (CYPRESS_INTERNAL_E2E_TESTING_SELF)', () => {
    // The inner Cypress shares the browser page with the parent — its runner
    // document is the parent's AUT document. Fulfilling own-origin internals
    // here hides the pause from the parent's interception (injection,
    // window:before:load), so the inner must release them to the wire.
    it('releases the own-origin runner document to the next middleware', async () => {
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn().mockResolvedValue({ id: 'req-1', statusCode: 200 })

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__/',
        method: 'GET',
        resourceType: 'other',
      }, next)

      expect(next).toHaveBeenCalledOnce()
      expect(serverRequest.create).not.toHaveBeenCalled()
    })

    it('releases own-origin namespace subresources with concrete types', async () => {
      // the app's graphql calls — the parent's cy.intercept must see these
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn().mockResolvedValue({ id: 'req-1', statusCode: 200 })

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__cypress/graphql/mutation-foo',
        method: 'POST',
        resourceType: 'xhr',
      }, next)

      expect(next).toHaveBeenCalledOnce()
      expect(serverRequest.create).not.toHaveBeenCalled()
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
      const next = vi.fn()

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__cypress/iframes/spec',
        method: 'GET',
        resourceType: 'other',
      }, next)

      expect(next).not.toHaveBeenCalled()
      expect(serverRequest.create).toHaveBeenCalledOnce()
    })

    it('releases own-origin clientRoute subresources to the next middleware', async () => {
      // matches the e2e-mode topology, where the inner has no interception
      // and the parent's pipeline carries /__/ assets already
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn().mockResolvedValue({ id: 'req-1', statusCode: 200 })

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__/assets/app.js',
        method: 'GET',
        resourceType: 'script',
      }, next)

      expect(next).toHaveBeenCalledOnce()
      expect(serverRequest.create).not.toHaveBeenCalled()
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
      const next = vi.fn()

      await middleware({
        id: 'req-1',
        url: 'http://localhost:5173/__cypress/xhrs/foo',
        method: 'GET',
        resourceType: 'other',
      }, next)

      expect(next).not.toHaveBeenCalled()
      expect(serverRequest.create).toHaveBeenCalledOnce()
    })

    it('keeps the loopback for own-origin internals outside cypress-in-cypress', async () => {
      const { middleware, serverRequest } = createMiddleware({
        statusCode: 200,
        headers: {},
        body: 'ok',
      })
      const next = vi.fn()

      await middleware({
        id: 'req-1',
        url: 'http://localhost:1234/__/',
        method: 'GET',
      }, next)

      expect(next).not.toHaveBeenCalled()
      expect(serverRequest.create).toHaveBeenCalledOnce()
    })
  })

  describe('loopback failures', () => {
    const econnreset = () => Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })

    it('answers locally instead of throwing so the request cannot escape to the origin', async () => {
      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn()

      serverRequest.create.mockRejectedValue(econnreset())

      const response = await middleware({
        id: 'req-1',
        url: 'http://localhost:8080/__/',
        method: 'GET',
      }, next)

      expect(next).not.toHaveBeenCalled()
      expect(response.statusCode).toBe(502)
      expect(response.body).toBe('Bad Gateway')
      expect(response.body).not.toContain('ECONNRESET')
    })

    it('replays a dead pooled socket and serves the response the retry got', async () => {
      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn()

      serverRequest.create.mockRejectedValueOnce(econnreset())
      serverRequest.create.mockResolvedValueOnce({ statusCode: 200, headers: {}, body: 'ok' })

      const response = await middleware({
        id: 'req-1',
        url: 'http://localhost:8080/__/',
        method: 'GET',
      }, next)

      expect(serverRequest.create).toHaveBeenCalledTimes(2)
      expect(response.statusCode).toBe(200)
      expect(response.body).toBe('ok')
    })

    it('does not replay a loopback the server may already have acted on', async () => {
      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn()

      serverRequest.create.mockRejectedValue(econnreset())

      const response = await middleware({
        id: 'req-1',
        url: 'http://localhost:8080/__cypress/process-origin-callback',
        method: 'POST',
        body: '{}',
      }, next)

      expect(serverRequest.create).toHaveBeenCalledOnce()
      expect(response.statusCode).toBe(502)
    })

    it('does not replay a failure a retry cannot fix', async () => {
      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn()

      serverRequest.create.mockRejectedValue(new Error('socket hang up'))

      const response = await middleware({
        id: 'req-1',
        url: 'http://localhost:8080/__/',
        method: 'GET',
      }, next)

      expect(serverRequest.create).toHaveBeenCalledOnce()
      expect(response.statusCode).toBe(502)
    })

    it('unwraps the network error @cypress/request wrapped before deciding to replay', async () => {
      const { middleware, serverRequest } = createMiddleware()
      const next = vi.fn()

      serverRequest.create.mockRejectedValueOnce(Object.assign(new Error('Error: read ECONNRESET'), { error: econnreset() }))
      serverRequest.create.mockResolvedValueOnce({ statusCode: 200, headers: {}, body: 'ok' })

      await middleware({
        id: 'req-1',
        url: 'http://localhost:8080/__/',
        method: 'GET',
      }, next)

      expect(serverRequest.create).toHaveBeenCalledTimes(2)
    })
  })
})
