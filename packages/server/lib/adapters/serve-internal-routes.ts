import Debug from 'debug'
import { toIdentityResponse } from '@packages/proxy'
import { asyncRetry } from '../util/async_retry'
import type { HttpHeaders, HttpRequest, InterceptMiddleware } from '@packages/network-interception'
import type { Request as ServerRequest } from '../request'
import { CYPRESS_INTERNAL_LOOPBACK_HEADER, CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER, cypressInternalLoopbackToken, isCloudBundleNamespace, isInternalCypressRoute, isReadMethod, isReleasedToParent, isTrustedInternalLoopback, parseRequestUrl, resolveProxyUrlBase } from './internal-routes'
import type { InternalRouteConfig } from './internal-routes'

const debug = Debug('cypress:server:serve-internal-routes')

type ServeInternalRoutesConfig = InternalRouteConfig

type CreateServeInternalRoutesMiddlewareOptions = {
  config: ServeInternalRoutesConfig
  request: ServerRequest
  // Fixed for the lifetime of the runtime installing this middleware: the MITM
  // runtime and the CDP Fetch runtime each own one network path, and a request
  // only reaches this stack through the runtime that is currently installed.
  isBrowserNetworkMode: boolean
}

const HOP_BY_HOP_HEADERS = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  CYPRESS_INTERNAL_LOOPBACK_HEADER,
  CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER,
])

function filterHeaders (headers: HttpHeaders = {}): HttpHeaders {
  return Object.entries(headers).reduce<HttpHeaders>((memo, [key, value]) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      memo[key] = value
    }

    return memo
  }, {})
}

function toLoopbackUrl (requestUrl: string, config: ServeInternalRoutesConfig): string {
  if (!config.port) {
    throw new Error('Cannot serve internal Cypress routes before the server port is assigned')
  }

  // Hit Express route handlers on the local server directly. Using the Cypress
  // server as an HTTP proxy would re-enter HttpIntercept / this middleware and
  // recurse forever when no earlier Express route owns the path.
  const url = new URL(requestUrl, resolveProxyUrlBase(config))

  return `http://127.0.0.1:${config.port}${url.pathname}${url.search}`
}

// The shared keep-alive agent can hand us a socket our own Express already
// closed, which surfaces as ECONNRESET. The server closes a whole idle batch at
// once and a runner boot fires these by the dozen, so one retry can land on
// another dead socket from the same batch. A fresh connection succeeds
// immediately, so spend the attempts quickly rather than slowly.
const LOOPBACK_RETRY_DELAYS = [0, 50, 250]

// A dead pooled socket, or the server not yet accepting. Any other failure
// fails the same way on a replay.
const RETRIABLE_LOOPBACK_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'EPIPE'])

// Only replay a loopback the server cannot already have acted on. A reset while
// a mutating response was in flight would double-apply it.
const REPLAYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// @cypress/request reports network failures wrapped in a RequestError.
function loopbackErrorCode (err: unknown): string | undefined {
  const wrapped = err as { code?: string, error?: { code?: string } } | undefined

  return wrapped?.error?.code ?? wrapped?.code
}

function describeLoopbackError (err: unknown): string {
  if (err instanceof AggregateError) {
    return err.errors.map((e: Error) => e.message).join('; ')
  }

  return (err as Error).message
}

function shouldSendBody (request: HttpRequest): boolean {
  return typeof request.body !== 'undefined' && !isReadMethod(request.method)
}

export function createServeInternalRoutesMiddleware ({
  config,
  request: serverRequest,
  isBrowserNetworkMode,
}: CreateServeInternalRoutesMiddlewareOptions): InterceptMiddleware {
  return async (request, next) => {
    const url = parseRequestUrl(request.url, config)

    if (!isInternalCypressRoute(url.pathname, config, isBrowserNetworkMode)) {
      return next(request)
    }

    // Re-entry after our own Express loopback. Require the process token —
    // AUT content can forge the URL header alone.
    if (isTrustedInternalLoopback(request.headers)) {
      // Cloud-bundle namespaces re-enter on purpose: the cypress-in-cypress parent's
      // Express handlers forward them through the proxy to the child project.
      // Hand them to the legacy pipeline instead of swallowing the forward.
      // The token authenticates re-entry and must not reach the child project
      // or the AUT.
      if (isCloudBundleNamespace(url.pathname)) {
        const headers = { ...request.headers }

        delete headers[CYPRESS_INTERNAL_LOOPBACK_HEADER]
        delete headers[CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]

        return next({ ...request, headers })
      }

      // Otherwise no route handler owned this path and the catch-all proxy saw
      // it again. Stop instead of looping forever.
      return {
        id: request.id,
        url: request.url,
        statusCode: 404,
        headers: { 'content-type': 'text/plain' },
        body: 'Not Found',
      }
    }

    if (isReleasedToParent(request, url, config)) {
      return next(request)
    }

    // Fulfill via Express for both same-origin and cross-origin internals.
    // sendRequestOutgoing would hit Express as a path-only request and get
    // forceProxy-redirected without the loopback header. On the browser network
    // path, most reads never get here: the resolver in network-runtime.ts
    // redirects them to the Cypress origin, and this fulfill handles the rest
    // (see resolveOriginRedirect for which). This skips later intercept layers
    // (including CorrelateBrowserPreRequest in MITM mode); pending
    // pre-requests for these internals are swept by the normal timeout path.
    // The loopback request line is path-only, but Express consumers (e.g. the
    // spec-bridge iframe controller) derive the request origin from
    // req.proxiedUrl, so carry the browser's original absolute URL in the
    // loopback header for setProxiedUrl to restore.
    const method = (request.method ?? 'GET').toUpperCase()

    const sendLoopback = () => {
      return serverRequest.create({
        url: toLoopbackUrl(request.url, config),
        method,
        headers: {
          ...filterHeaders(request.headers),
          [CYPRESS_INTERNAL_LOOPBACK_HEADER]: url.href,
          [CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]: cypressInternalLoopbackToken,
        },
        ...(shouldSendBody(request) ? { body: request.body } : {}),
        encoding: null,
        followRedirect: false,
        gzip: false,
        resolveWithFullResponse: true,
        simple: false,
      }, true)
    }

    let response

    // Never throw for a route we claimed: the CDP Fetch transport releases a
    // throwing pause with a bare Fetch.continueRequest, which fetches this
    // Cypress URL from the site under test. That 404s, so the runner document
    // or one of its chunks silently never loads and the run stalls forever.
    try {
      response = await asyncRetry(sendLoopback, {
        maxAttempts: LOOPBACK_RETRY_DELAYS.length + 1,
        retryDelay: (attempt) => LOOPBACK_RETRY_DELAYS[attempt - 1] ?? 0,
        shouldRetry: (err) => REPLAYABLE_METHODS.has(method) && RETRIABLE_LOOPBACK_CODES.has(loopbackErrorCode(err) ?? ''),
        onRetry: (delay, err) => debug('retrying internal route loopback for %s in %dms: %s', url.pathname, delay, loopbackErrorCode(err)),
      })()
    } catch (err) {
      // The body is served on the AUT's origin, where page content can read it,
      // so keep the detail here rather than in the response.
      debug('internal route loopback failed for %s: %s', url.pathname, describeLoopbackError(err))

      return {
        id: request.id,
        url: request.url,
        statusCode: 502,
        headers: { 'content-type': 'text/plain' },
        body: 'Bad Gateway',
      }
    }

    // Fetch.fulfillRequest bodies are identity-only — the browser runs no
    // content-encoding decoders on fulfilled responses. A hop past the loopback
    // can still compress (the cy-in-cy parent's proxy re-adds accept-encoding),
    // so normalize the same way the synthetic codec does before fulfilling.
    return toIdentityResponse({
      id: request.id,
      url: request.url,
      statusCode: response.statusCode,
      headers: filterHeaders(response.headers),
      body: response.body,
    })
  }
}
