/**
 * NOTE: ad-hoc benchmark for `handleInterceptResponse` — skipped unless explicitly enabled:
 *
 *   NET_STUBBING_PERF=1 yarn workspace @packages/net-stubbing test -- run test/perf/intercept-response-perf.spec.ts
 *
 * Simulates a paced origin response flowing through the InterceptResponse middleware
 * and measures, from the moment the middleware is invoked:
 *   - ttfb:  time until the downstream (client) sink receives the first byte
 *   - total: time until the downstream (client) sink receives the last byte
 *   - notified: time until the `response:callback` driver event was emitted
 */
import { describe, it } from 'vitest'
import { Readable } from 'stream'
import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import { handleInterceptResponse } from '../../lib/server/handle-intercept-response'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'

const KB = 1024
const MB = 1024 * KB

type ScenarioOptions = {
  name: string
  bodyBytes: number
  chunkBytes: number
  // delay between origin chunks (simulated network pacing); 0 = as fast as possible
  intervalMs: number
  // whether the driver has an awaited response handler (e.g. req.continue(cb))
  awaited: boolean
}

type ScenarioResult = {
  ttfb: number
  total: number
  notified: number
  originDone: number
}

function makeOrigin (bodyBytes: number, chunkBytes: number, intervalMs: number, onDone: () => void): Readable {
  let sent = 0

  return new Readable({
    read () {
      const send = () => {
        const remaining = bodyBytes - sent
        const size = Math.min(chunkBytes, remaining)

        sent += size
        this.push(Buffer.alloc(size, 97))

        if (sent >= bodyBytes) {
          onDone()
          this.push(null)
        }
      }

      if (intervalMs > 0) {
        setTimeout(send, intervalMs)
      } else {
        setImmediate(send)
      }
    },
  })
}

async function runScenario (opts: ScenarioOptions): Promise<ScenarioResult> {
  const state = NetStubbingState()

  const socket = {
    toDriver (_event: string, eventName: string, frame: any) {
      if (eventName === 'response:callback' && !frame.subscription.id) {
        result.notified = performance.now() - t0
      }

      if (frame.subscription.await) {
        // simulate the driver resolving the event handler on its next tick
        setImmediate(() => {
          state.pendingEventHandlers[frame.eventId]({ changedData: frame.data, stopPropagation: false })
        })
      }
    },
  }

  const res = new EventEmitter() as any

  const request = new InterceptedRequest({
    req: {
      matchingRoutes: [
        // @ts-ignore
        { id: '1', hasInterceptor: opts.awaited, routeMatcher: {} },
      ],
    } as any,
    res,
    continueRequest: () => {},
    onError (err) {
      throw err
    },
    onResponse: () => {},
    state,
    socket: socket as any,
  })

  request.addDefaultSubscriptions()

  if (opts.awaited) {
    request.addSubscription({
      id: 'sub1',
      routeId: '1',
      eventName: 'response:callback',
      await: true,
    })
  }

  state.requests[request.id] = request

  const result: ScenarioResult = { ttfb: -1, total: -1, notified: -1, originDone: -1 }

  const t0 = performance.now()

  const origin = makeOrigin(opts.bodyBytes, opts.chunkBytes, opts.intervalMs, () => {
    result.originDone = performance.now() - t0
  })

  const done = new Promise<void>((resolve) => {
    const mw: any = {
      req: { requestId: request.id, proxiedUrl: 'http://localhost/test', method: 'GET' },
      res,
      netStubbingState: state,
      incomingRes: {
        statusCode: 200,
        statusMessage: 'OK',
        httpVersion: '1.1',
        headers: { 'content-type': 'application/octet-stream' },
      },
      incomingResStream: origin,
      makeResStreamPlainText () {},
      onError (err: Error) {
        throw err
      },
      next () {
        // emulate SendResponseBodyToClient: consume the stream as the client would
        let received = 0

        mw.incomingResStream.on('data', (chunk: Buffer) => {
          if (result.ttfb === -1) {
            result.ttfb = performance.now() - t0
          }

          received += chunk.length
        })

        mw.incomingResStream.on('end', () => {
          result.total = performance.now() - t0

          if (received !== opts.bodyBytes) {
            throw new Error(`body size mismatch: expected ${opts.bodyBytes}, got ${received}`)
          }

          resolve()
        })
      },
    }

    handleInterceptResponse(mw)
  })

  await done

  // allow any background notification to be emitted before measuring
  await new Promise((resolve) => setTimeout(resolve, 50))

  return result
}

const fmt = (n: number) => n === -1 ? 'n/a' : `${n.toFixed(1)}ms`

describe.runIf(process.env.NET_STUBBING_PERF)('InterceptResponse latency benchmark', () => {
  it('measures spy-only and awaited-handler scenarios', { timeout: 120_000 }, async () => {
    const scenarios: ScenarioOptions[] = [
      { name: 'spy 64KB paced', bodyBytes: 64 * KB, chunkBytes: 16 * KB, intervalMs: 5, awaited: false },
      { name: 'spy 1MB paced', bodyBytes: 1 * MB, chunkBytes: 64 * KB, intervalMs: 5, awaited: false },
      { name: 'spy 10MB paced', bodyBytes: 10 * MB, chunkBytes: 64 * KB, intervalMs: 2, awaited: false },
      { name: 'spy 1MB unpaced', bodyBytes: 1 * MB, chunkBytes: 64 * KB, intervalMs: 0, awaited: false },
      { name: 'spy 10MB unpaced', bodyBytes: 10 * MB, chunkBytes: 64 * KB, intervalMs: 0, awaited: false },
      { name: 'handler 1MB paced', bodyBytes: 1 * MB, chunkBytes: 64 * KB, intervalMs: 5, awaited: true },
      { name: 'handler 10MB unpaced', bodyBytes: 10 * MB, chunkBytes: 64 * KB, intervalMs: 0, awaited: true },
    ]

    const rows: string[] = []

    for (const scenario of scenarios) {
      // warmup + 3 runs, report the median by total
      await runScenario(scenario)

      const runs: ScenarioResult[] = []

      for (let i = 0; i < 3; i++) {
        runs.push(await runScenario(scenario))
      }

      runs.sort((a, b) => a.total - b.total)
      const r = runs[1]

      rows.push(`${scenario.name.padEnd(22)} origin=${fmt(r.originDone).padEnd(9)} ttfb=${fmt(r.ttfb).padEnd(9)} total=${fmt(r.total).padEnd(9)} notified=${fmt(r.notified)}`)
    }

    // eslint-disable-next-line no-console
    console.log(`\n=== InterceptResponse benchmark ===\n${rows.join('\n')}\n`)
  })
})
