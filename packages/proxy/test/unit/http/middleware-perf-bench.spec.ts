// TEMPORARY benchmark harness — not intended to be committed.
// Drives the real Http#handleHttpRequest with realistic stack shapes
// (16 request / 20 response / 6 error middleware) and no-op handlers to
// measure the overhead of the middleware machinery itself.
import { EventEmitter } from 'events'
import { describe, it, vi } from 'vitest'
import { Http, HttpStages } from '../../../lib/http'
import type { HttpMiddlewareStacks } from '../../../lib/http'

const REQ_NAMES = [
  'LogRequest', 'ExtractCypressMetadataHeaders', 'MaybeSimulateSecHeaders',
  'CorrelateBrowserPreRequest', 'CalculateCredentialLevelIfApplicable',
  'FormatCookiesIfApplicable', 'MaybeAttachCrossOriginCookies',
  'MaybeEndRequestWithBufferedResponse', 'SetMatchingRoutes', 'SendToDriver',
  'InterceptRequest', 'RedirectToClientRouteIfUnloaded', 'EndRequestsToBlockedHosts',
  'StripUnsupportedAcceptEncoding', 'MaybeSetBasicAuthHeaders', 'SendRequestOutgoing',
]

const RES_NAMES = [
  'LogResponse', 'FilterNonProxiedResponse', 'AttachPlainTextStreamFn',
  'InterceptResponse', 'PatchExpressSetHeader', 'OmitProblematicHeaders',
  'MaybeSetOriginAgentClusterHeader', 'SetInjectionLevel', 'MaybePreventCaching',
  'MaybeStripDocumentDomainFeaturePolicy', 'MaybeCopyCookiesFromIncomingRes',
  'MaybeSendRedirectToClient', 'CopyResponseStatusCode', 'ClearCyInitialCookie',
  'MaybeEndWithEmptyBody', 'MaybeInjectHtml', 'MaybeRemoveSecurity',
  'MaybeInjectServiceWorker', 'CompressBody', 'SendResponseBodyToClient',
]

const ERROR_NAMES = [
  'LogError', 'SendToDriver', 'InterceptError', 'AbortRequest',
  'UnpipeResponse', 'DestroyResponse',
]

function makeStage (names: string[], lastBehavior: 'onResponse' | 'end') {
  const stage: Record<string, any> = {}

  names.forEach((name, i) => {
    const isLast = i === names.length - 1

    if (isLast && lastBehavior === 'onResponse') {
      // like SendRequestOutgoing: hand off to the response phase
      stage[name] = function () {
        this.onResponse({ headers: {} }, {})
      }
    } else if (isLast && lastBehavior === 'end') {
      // like SendResponseBodyToClient: finish the response phase
      stage[name] = function () {
        this.end()
      }
    } else if (name === 'MaybeInjectHtml') {
      // exercise the skipMiddleware path like the real MaybeInjectHtml does
      stage[name] = function () {
        this.skipMiddleware('MaybeRemoveSecurity')
        this.next()
      }
    } else {
      stage[name] = function () {
        this.next()
      }
    }
  })

  return stage
}

function makeStacks (): HttpMiddlewareStacks {
  return {
    [HttpStages.IncomingRequest]: makeStage(REQ_NAMES, 'onResponse'),
    [HttpStages.IncomingResponse]: makeStage(RES_NAMES, 'end'),
    [HttpStages.Error]: makeStage(ERROR_NAMES, 'end'),
  } as HttpMiddlewareStacks
}

function makeRes () {
  const res = new EventEmitter() as any

  res.writableFinished = true
  res.destroyed = false

  return res
}

describe('middleware traversal benchmark', () => {
  it('measures µs/request through Http#handleHttpRequest', { timeout: 120_000 }, async () => {
    const http = new Http({
      config: {},
      middleware: makeStacks(),
      request: { rp: vi.fn() },
    } as any)

    const simulateRequest = () => {
      const req: any = { method: 'GET', proxiedUrl: 'http://localhost:3000/foo.js', headers: {} }

      return http.handleHttpRequest(req, makeRes())
    }

    // warmup
    for (let i = 0; i < 3_000; i++) {
      await simulateRequest()
    }

    const runs: number[] = []

    for (let run = 0; run < 5; run++) {
      const N = 20_000
      const start = process.hrtime.bigint()

      for (let i = 0; i < N; i++) {
        await simulateRequest()
      }

      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6

      runs.push(elapsedMs / N * 1000) // µs per request
    }

    runs.sort((a, b) => a - b)

    // eslint-disable-next-line no-console
    console.log(`\n=== handleHttpRequest: µs/request (5 runs, sorted): ${runs.map((r) => r.toFixed(2)).join(', ')} | median ${runs[2].toFixed(2)} µs ===\n`)
  })
})
