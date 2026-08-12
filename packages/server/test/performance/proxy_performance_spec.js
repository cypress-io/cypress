require('../spec_helper')

const { getCtx, setCtx, makeDataContext, clearCtx } = require('../../lib/makeDataContext')

const cp = require('child_process')
const fse = require('fs-extra')
const http2 = require('http2')
const os = require('os')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const { expect } = require('chai')
const debug = require('debug')('test:proxy-performance')
const DebuggingProxy = require('@cypress/debugging-proxy')
const HarCapturer = require('chrome-har-capturer')
const performance = require('@tooling/system-tests/lib/performance')
const Promise = require('bluebird')
const sanitizeFilename = require('sanitize-filename')
const { createRoutes } = require(`../../lib/routes`)

process.env.CYPRESS_INTERNAL_ENV = 'development'

const { CA } = require('@packages/https-proxy')
const { setupFullConfigWithDefaults } = require('@packages/config')
const { ServerBase } = require('../../lib/server-base')
const { SocketE2E } = require('../../lib/socket-e2e')
const { _getArgs } = require('../../lib/browsers/chrome')

/**
 * Resolves an absolute or PATH-resolvable Chrome/Chromium binary for `cp.spawn`.
 * CI/Linux often exposes `google-chrome`; macOS and Windows need well-known install
 * locations or an explicit env override.
 *
 * Resolution order:
 * 1. `PROXY_PERF_CHROME` — preferred override for this spec only.
 * 2. `CHROME_PATH` — generic override if the first is unset.
 * 3. macOS: `/Applications/Google Chrome.app/...` then Chrome Canary.
 * 4. Windows: standard `Program Files` Chrome paths.
 * 5. Unix: first hit from `which` for `google-chrome`, `google-chrome-stable`, `chromium`, `chromium-browser`.
 * 6. Fallback `google-chrome` (relies on PATH; matches typical Linux CI images).
 */
const resolveChromePathForProxyPerformance = () => {
  const fromEnv = process.env.PROXY_PERF_CHROME || process.env.CHROME_PATH

  if (fromEnv) {
    return fromEnv
  }

  const platform = os.platform()

  if (platform === 'darwin') {
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    ]

    for (const macPath of macPaths) {
      if (fs.existsSync(macPath)) {
        return macPath
      }
    }
  }

  if (platform === 'win32') {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ]

    for (const winPath of winPaths) {
      if (fs.existsSync(winPath)) {
        return winPath
      }
    }
  }

  const nixNames = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']

  for (const nixName of nixNames) {
    const r = cp.spawnSync('which', [nixName], { encoding: 'utf8' })

    if (r.status === 0) {
      const found = String(r.stdout || '').trim().split('\n')[0]

      if (found) {
        return found
      }
    }
  }

  return 'google-chrome'
}

const CHROME_PATH = resolveChromePathForProxyPerformance()
const URLS_UNDER_TEST = [
  'https://test-page-speed.cypress.io/index1000.html',
  'http://test-page-speed.cypress.io/index1000.html',
]

const start = (new Date()) / 1000

const PROXY_PORT = process.env.PROXY_PORT || 45678
const HTTPS_PROXY_PORT = process.env.HTTPS_PROXY_PORT || 45681
const CY_PROXY_PORT = 45680
// the proxy-disabled ServerBase must bind a port to open(), but the browser
// never connects to it — interception happens over the CDP connection
const PROXY_DISABLED_CY_SERVER_PORT = 45682

// HTTP/2's win is eliminating HTTP/1.1 connection queueing, which requires
// per-request latency — near-zero on CI, so the hosted page can't show the win
// there. This origin injects the latency as a per-response delay instead.
const HTTP2_LATENCY_ORIGIN_PORT = 45333
const HTTP2_LATENCY_ORIGIN_DELAY_MS = 50
const HTTP2_LATENCY_ORIGIN_URL = `https://localhost:${HTTP2_LATENCY_ORIGIN_PORT}/index1000.html`

// Chrome's debug port is randomized per launch, so the range has to stay clear
// of every fixed port this spec binds. A collision leaves Chrome unable to
// bind, and runHar's ECONNREFUSED retry reuses the same port — so the run
// hangs to the timeout instead of recovering.
const CDP_PORT_RANGE_START = 46000
const CDP_PORT_RANGE_SIZE = 10000

const FIXED_PORTS = {
  PROXY_PORT,
  HTTPS_PROXY_PORT,
  CY_PROXY_PORT,
  PROXY_DISABLED_CY_SERVER_PORT,
  HTTP2_LATENCY_ORIGIN_PORT,
}

// enforced rather than commented: PROXY_PORT/HTTPS_PROXY_PORT come from the
// environment, so the invariant can be broken from outside this file
Object.entries(FIXED_PORTS).forEach(([name, port]) => {
  if (Number(port) >= CDP_PORT_RANGE_START && Number(port) < CDP_PORT_RANGE_START + CDP_PORT_RANGE_SIZE) {
    throw new Error(`${name} (${port}) falls inside the randomized Chrome debug-port range ${CDP_PORT_RANGE_START}-${CDP_PORT_RANGE_START + CDP_PORT_RANGE_SIZE - 1}; pick a port outside it`)
  }
})

const TEST_CASES = [
  // these first 4 cases don't involve Cypress, don't need to run every time
  // {
  //   name: 'Chrome w/o HTTP/2',
  //   disableHttp2: true,
  // },
  // {
  //   name: 'Chrome',
  // },
  // {
  //   name: 'With proxy',
  //   upstreamProxy: true,
  // },
  // {
  //   name: 'With HTTPS proxy',
  //   httpsUpstreamProxy: true,
  // },
  // baseline test that all other tests are compared to
  {
    name: 'Chrome w/ proxy w/o HTTP/2 (baseline)',
    disableHttp2: true,
    upstreamProxy: true,
  },
  {
    name: 'With Cypress proxy, Intercepted',
    cyProxy: true,
    cyIntercept: true,
  },
  {
    name: 'With Cypress proxy, Not Intercepted',
    cyProxy: true,
  },
  {
    name: 'With Cypress proxy w/o HTTP/2, Not Intercepted',
    cyProxy: true,
    disableHttp2: true,
  },
  {
    name: 'With Cypress proxy and upstream, Intercepted',
    cyProxy: true,
    upstreamProxy: true,
    cyIntercept: true,
  },
  {
    name: 'With Cypress proxy and HTTPS upstream, Intercepted',
    cyProxy: true,
    httpsUpstreamProxy: true,
    cyIntercept: true,
  },
  {
    name: 'With Cypress proxy and upstream, Not Intercepted',
    cyProxy: true,
    upstreamProxy: true,
  },
  {
    name: 'With Cypress proxy and HTTPS upstream, Not Intercepted',
    cyProxy: true,
    httpsUpstreamProxy: true,
  },
  // raw Chrome with no Cypress in the path at all — no proxy, no interception:
  // proves this Chrome + origin negotiate HTTP/2 when uninstrumented. The
  // intercepted cases can't show this themselves: Fetch.fulfillRequest commits
  // a synthesized response, so under interception the HAR protocol field is
  // unreliable (always http/1.1) even though the wire traffic is not downgraded
  {
    name: 'Chrome w/o Cypress (HTTP/2 control)',
    http2Control: true,
  },
  // proxy-disabled mode: CYPRESS_INTERNAL_DISABLE_PROXY=1, interception via
  // CDP Fetch, so the browser keeps its native HTTP/2 connection to the
  // origin (#3708)
  {
    name: 'With proxy disabled, Intercepted (CDP)',
    proxyDisabled: true,
  },
  // same CDP interception pinned to HTTP/1.1. Three reasons this matters:
  //  - isolates the HTTP/2 protocol win from the transport swap (vs above)
  //  - exposes per-request CDP pause/body-ferry overhead that HTTP/2
  //    multiplexing otherwise hides (regression guard)
  //  - is the exact path HTTP/1.1-only origins get under proxy-disabled mode
  {
    name: 'With proxy disabled, Intercepted (CDP) w/o HTTP/2',
    proxyDisabled: true,
    disableHttp2: true,
  },
].map((v) => {
  // fill in all the fields so the keys are in the correct order for readability
  return makeTestCase(v)
})

function makeTestCase (v) {
  return _.defaults(v, {
    disableHttp2: false,
    upstreamProxy: false,
    httpsUpstreamProxy: false,
    cyProxy: false,
    cyIntercept: false,
    http2Control: false,
    proxyDisabled: false,
  })
}

const startLatencyOrigin = (cert, key) => {
  // mirrors the hosted test-page-speed page: 1000 unique image fetches.
  // Lives in support/fixtures because the runner's `test/performance/**` glob
  // would otherwise hand the .html file to mocha as a spec
  const html = fs.readFileSync(path.join(__dirname, '../support/fixtures/index1000.html'), 'utf8')
  const imageBody = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(2044)])

  // bare request handler — Express over http2.createSecureServer dies
  // in-process (see system-tests/projects/http2-dual-stack/README.md).
  // allowHTTP1 keeps the MITM proxy's HTTP/1.1 upstream requests and the
  // --disable-http2 browser cases working against the same origin.
  const server = http2.createSecureServer({ cert, key, allowHTTP1: true })

  // Chrome is killed with SIGKILL after each measurement, resetting any
  // kept-alive sockets mid-flight — swallow the socket-level errors so they
  // don't become uncaught exceptions in the mocha process
  server.on('connection', (socket) => socket.on('error', () => {}))
  server.on('secureConnection', (socket) => socket.on('error', () => {}))
  server.on('tlsClientError', () => {})
  server.on('sessionError', () => {})

  server.on('request', (req, res) => {
    if (req.url.startsWith('/files/')) {
      return setTimeout(() => {
        if (res.writableEnded || res.destroyed || (res.stream && res.stream.destroyed)) {
          return
        }

        res.setHeader('content-type', 'image/jpeg')
        // must be cacheable: the page's fetch()es never read the bodies, so
        // without a cache sink draining them Network.loadingFinished never
        // fires and chrome-har-capturer drops the entries from the HAR. The
        // URLs are unique and every run gets a fresh profile, so each request
        // still hits the network exactly once (same as the hosted page)
        res.setHeader('cache-control', 'max-age=600')
        res.end(imageBody)
      }, HTTP2_LATENCY_ORIGIN_DELAY_MS)
    }

    res.setHeader('content-type', 'text/html')
    res.end(html)
  })

  return new Promise((resolve, reject) => {
    // explicit loopback bind + loud failure: a soft conflict (another
    // process on the IPv4 side) would otherwise misroute every request
    server.on('error', reject)
    server.listen(HTTP2_LATENCY_ORIGIN_PORT, '127.0.0.1', resolve)
  })
}

const EXPECTED_IMAGE_COUNT = 1000

// The fixture fires 1000 `fetch()` calls from an inline script and contains no `<img>`
// elements, so `Page.loadEventFired` - the only completion signal chrome-har-capturer waits
// for - lands while every image is still outstanding. Requests that have not produced a
// `Network.loadingFinished` by the time capture stops are dropped from the HAR rather than
// recorded as failures, so capture has to stay open until enough of them have landed.
const CAPTURE_TIMEOUT_MS = Number(process.env.PROXY_PERF_CAPTURE_TIMEOUT) || 15000

// The latency origin's MITM captures are queueing-bound at ~1000 x 50ms / ~6
// connections ≈ 9-10s, and the no-h2 assertion allows up to 2x that — the
// capture window has to outlast the assertion boundary, or a slow-but-assertable
// run dies as a capture timeout before the assertion can fail it. On a
// CPU-starved runner both sides stretch well past that, so the window is
// overridable rather than fixed.
const HTTP2_LATENCY_CAPTURE_TIMEOUT_MS = Number(process.env.PROXY_PERF_H2_CAPTURE_TIMEOUT) || 45000

// The default is sized for a flaky fixture host, where a retry gets a different
// page. A slow box is not flaky - it fails every attempt - so re-measuring both
// sides 16 times only multiplies the runtime. An unset CI parameter arrives as an
// empty string, which has to mean "default" rather than Number('') === 0.
const RETRIES = process.env.PROXY_PERF_RETRIES ? Number(process.env.PROXY_PERF_RETRIES) : 15

// The comparative timing assertions encode an environment: they hold where CPU
// is cheap enough for the CDP pipeline to stay off the critical path. When
// benchmarking deliberately-constrained infrastructure, the expected outcome and
// a red build are the same event, so the timings are reported and the
// wire-protocol assertions - which are correctness, not performance - stay on.
const REPORT_ONLY = ['1', 'true'].includes(process.env.PROXY_PERF_REPORT_ONLY)

// When the fixture host serves something other than the fixture - a GitHub Pages error
// page, say - the symptom is an oddly small request count with nothing pending, so the
// diagnostic has to name what actually loaded.
const REPORTED_URL_COUNT = 5

// The fixture initiates all 1000 `fetch()` calls from an inline script during parse, so a
// good load has already started them by the time `postHook` runs. A page that has not is
// not the fixture and never will be, so there is nothing to wait for - fail immediately and
// let the retry pick up a load that got the real page. This beat covers initiation lagging
// the load event.
const BAD_PAGE_GRACE_MS = 1000

/**
 * Reads a cgroup controller file for this process, or null when it cannot be read
 * (not Linux, no cgroup, or an unconstrained cgroup).
 *
 * cgroup v2 reports a single `0::/<path>` entry in `/proc/self/cgroup`, relative to
 * the cgroup mount. Inside a container the cgroup namespace maps that to the mount
 * root, but on a bare host the controller files live under the sub-cgroup, so the
 * base has to be resolved rather than assumed.
 */
const readCgroupValue = async (file) => {
  try {
    const raw = await fse.readFile('/proc/self/cgroup', 'utf8')
    const relative = raw.split('\n').find((line) => line.startsWith('0::'))?.slice(3).trim().replace(/^\/+/, '')

    return (await fse.readFile(path.join('/sys/fs/cgroup', relative || '', file), 'utf8')).trim()
  } catch {
    return null
  }
}

// `os.cpus()` reports the host's core count inside a container, not the cgroup
// budget, so Chrome and libuv size their thread pools for a machine they do not
// have. Recording what was seen alongside what was actually granted is what makes
// a cross-size comparison interpretable.
const describeEnvironment = async () => {
  return {
    label: process.env.PROXY_PERF_LABEL || 'local',
    coresSeen: os.cpus().length,
    totalMemBytes: os.totalmem(),
    cgroupCpuMax: await readCgroupValue('cpu.max'),
    cgroupMemoryMax: await readCgroupValue('memory.max'),
  }
}

/**
 * Appends one JSON line per measurement to `$CIRCLE_ARTIFACTS/proxy-perf.jsonl`.
 * `console.table` is readable in a single job's log but does not aggregate across
 * a matrix of them, which is what the comparison actually needs.
 */
const recordBenchmark = async (record) => {
  const line = JSON.stringify({ ...await describeEnvironment(), ...record })

  debug('benchmark record %s', line)

  const artifacts = process.env.CIRCLE_ARTIFACTS

  if (!artifacts) return

  await fse.ensureDir(artifacts)
  await fse.appendFile(path.join(artifacts, 'proxy-perf.jsonl'), `${line}\n`)
}

/**
 * Asserts `actual` is under `bound`, unless REPORT_ONLY - in which case the
 * comparison is reported and the run stays green.
 */
const expectTiming = (actual, bound, message) => {
  if (REPORT_ONLY) {
    process.stdout.write(`report-only: ${message} - ${actual} vs bound ${bound} (${actual < bound ? 'within' : 'over'})\n`)

    return
  }

  expect(actual, message).to.be.lessThan(bound)
}

const createHarCaptureHooks = (captureTimeoutMs = CAPTURE_TIMEOUT_MS) => {
  const started = new Set()
  const finished = new Set()
  const failed = new Set()
  const startedUrls = []
  let onTargetReached = _.noop

  const onCdpEvent = ({ method, params }) => {
    switch (method) {
      case 'Network.requestWillBeSent':
        // chrome-har-capturer does not create an entry for a data URI, so neither do we
        if (params.request.url.startsWith('data:')) return

        started.add(params.requestId)
        startedUrls.push(params.request.url)
        break
      case 'Network.loadingFailed':
        // Only count IDs we tracked in `started` - data: URLs are skipped there to match
        // chrome-har-capturer, but still emit loadingFailed/loadingFinished and would
        // otherwise inflate finished past EXPECTED_IMAGE_COUNT and end capture early.
        if (!started.has(params.requestId)) return

        failed.add(params.requestId)
        break
      case 'Network.loadingFinished':
        if (!started.has(params.requestId)) return

        finished.add(params.requestId)

        if (finished.size >= EXPECTED_IMAGE_COUNT) onTargetReached()

        break
      default:
    }
  }

  return {
    // `preHook` runs before the page is navigated, so counting starts with the document
    // request; by the time `postHook` runs the fetches are already in flight.
    trackNetworkActivity: (cdp) => {
      cdp.on('event', onCdpEvent)
    },
    // Waiting on `Network.loadingFinished` counts is the same condition `getResultsFromHar`
    // asserts on, so capture stops exactly when the HAR is known to be complete enough.
    // Waiting instead for every request to settle would let a single straggler out of a
    // thousand hold the capture open for the full timeout.
    waitForEnoughRequests: () => {
      const describeCapture = () => {
        return `${started.size} started, ${finished.size} finished, ${failed.size} failed. First ${REPORTED_URL_COUNT} requested: ${startedUrls.slice(0, REPORTED_URL_COUNT).join(', ')}`
      }

      return Promise.try(() => {
        if (started.size >= EXPECTED_IMAGE_COUNT) return

        return Promise.delay(BAD_PAGE_GRACE_MS).then(() => {
          if (started.size < EXPECTED_IMAGE_COUNT) {
            throw new Error(`The page under test never requested ${EXPECTED_IMAGE_COUNT} images, so it is not the fixture. ${describeCapture()}`)
          }
        })
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          if (finished.size >= EXPECTED_IMAGE_COUNT) return resolve()

          const timeout = setTimeout(() => {
            reject(new Error(`Timed out after ${captureTimeoutMs}ms waiting for ${EXPECTED_IMAGE_COUNT} requests to finish loading. ${describeCapture()}`))
          }, captureTimeoutMs)

          onTargetReached = () => {
            clearTimeout(timeout)
            resolve()
          }
        })
      })
      // chrome-har-capturer surfaces whatever `postHook` returns as `log.pages[0]._user`
      .then(() => ({ requestsStarted: started.size }))
    },
  }
}

const average = (arr) => {
  return _.sum(arr) / arr.length
}

const percentile = (sortedArr, p) => {
  const i = Math.floor(p / 100 * (sortedArr.length - 1))

  return Math.round(sortedArr[i])
}

const getResultsFromHar = (har) => {
  // HAR 1.2 Spec: http://www.softwareishard.com/blog/har-12-spec/
  const { entries } = har.log
  const results = {}

  const requestsStarted = _.get(har, 'log.pages[0]._user.requestsStarted')
  const diagnosis = requestsStarted >= EXPECTED_IMAGE_COUNT
    ? 'capture ended while requests were still in flight - an entry with no `Network.loadingFinished` is dropped from the HAR, not recorded as a failure'
    : 'the page did not start the expected number of requests'

  expect(
    entries.length,
    `${requestsStarted} requests started, ${entries.length} recorded in the HAR - ${diagnosis}`,
  ).to.be.at.least(EXPECTED_IMAGE_COUNT)

  const first = entries[0]
  const last = entries[entries.length - 1]
  const elapsed = Number(new Date(last.startedDateTime)) + last.time - Number(new Date(first.startedDateTime))

  results['Total'] = Math.round(elapsed)

  let mins = {}
  let maxes = {}

  const timings = {
    'receive': [],
    'wait': [],
    'send': [],
    'total': [],
  }

  entries.forEach((entry) => {
    const blockedTime = _.get(entry.timings, 'blocked', -1) === -1 ? 0 : entry.timings.blocked
    const totalTime = entry.time - blockedTime

    timings.total.push(totalTime)

    Object.keys(entry.timings).forEach((timingKey) => {
      if (entry.timings[timingKey] === -1 || !entry.timings[timingKey]) return

      const ms = Math.round(entry.timings[timingKey])

      if (timings[timingKey]) timings[timingKey].push(ms)
    })
  })

  for (const key in timings) {
    const arr = timings[key]

    arr.sort((a, b) => {
      return a - b
    })

    mins[key] = Math.round(arr[0])
    maxes[key] = Math.round(arr[arr.length - 1])

    _.merge(results, {
      [`Avg ${_.upperFirst(key)}`]: Math.round(average(arr)),
    })
  }

  results['Min'] = mins.total

  ;[1, 5, 25, 50, 75, 95, 99, 99.7].forEach((p) => {
    results[`${p}% <=`] = percentile(timings.total, p)
  })

  results['Max'] = maxes.total

  return results
}

const runBrowserTest = (urlUnderTest, testCase, { onHar, onWire, captureTimeoutMs } = {}) => {
  const cdpPort = CDP_PORT_RANGE_START + Math.floor(Math.random() * CDP_PORT_RANGE_SIZE)

  const browser = {
    isHeadless: true,
  }

  const options = {}

  // cases run serially, so scoping the production proxy-disabled gate to this
  // case cannot leak into the MITM cases
  if (testCase.proxyDisabled) {
    process.env.CYPRESS_INTERNAL_DISABLE_PROXY = '1'
  } else {
    delete process.env.CYPRESS_INTERNAL_DISABLE_PROXY
  }

  const args = _getArgs(browser, options, cdpPort).concat([
    // additionally...
    '--disable-background-networking',
    '--no-sandbox', // allows us to run as root, for CI
    `--user-data-dir=${fse.mkdtempSync(path.join(os.tmpdir(), 'cy-perf-'))}`,
  ])

  if (testCase.disableHttp2) {
    args.push('--disable-http2')
  }

  if (testCase.proxyDisabled || testCase.http2Control) {
    // An Alt-Svc header on the document response advertises HTTP/3 (QUIC), so
    // the image requests can switch off HTTP/2 mid-load. Disabling QUIC pins
    // the browser to HTTP/2 for the protocol assertion
    args.push('--disable-quic')
  }

  if (testCase.cyProxy) {
    args.push(`--proxy-server=http://localhost:${CY_PROXY_PORT}`)
    // Chrome implicitly bypasses proxies for loopback hosts; subtract the
    // implicit bypass (as production Cypress does) so the synthetic latency
    // origin still routes through the proxy
    args.push('--proxy-bypass-list=<-loopback>')
  }

  if (testCase.upstreamProxy && !testCase.cyProxy) {
    args.push(`--proxy-server=http://localhost:${PROXY_PORT}`)
  } else if (testCase.httpsUpstreamProxy && !testCase.cyProxy) {
    args.push(`--proxy-server=https://localhost:${HTTPS_PROXY_PORT}`)
  }

  if (testCase.upstreamProxy && testCase.cyProxy) {
    process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `http://localhost:${PROXY_PORT}`
  } else if (testCase.httpsUpstreamProxy && testCase.cyProxy) {
    process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `https://localhost:${HTTPS_PROXY_PORT}`
  } else {
    delete process.env.HTTPS_PROXY
    delete process.env.HTTP_PROXY
  }

  if (testCase.cyIntercept) {
    cyServer.remoteStates.set(urlUnderTest)
  } else {
    cyServer.remoteStates.set('<root>')
  }

  if (testCase.proxyDisabled) {
    proxyDisabledServer.remoteStates.set(urlUnderTest)
  }

  let cmd = CHROME_PATH

  debug('Launching Chrome: ', cmd, args.join(' '))

  const proc = cp.spawn(cmd, args, {
    stdio: 'ignore',
  })

  const storeHar = Promise.method((name, har) => {
    const artifacts = process.env.CIRCLE_ARTIFACTS

    if (artifacts) {
      return fse.ensureDir(artifacts)
      .then(() => {
        const pathToFile = path.join(artifacts, sanitizeFilename(`${name}.har`))

        debug('saving har to path:', pathToFile)

        return fse.writeJson(pathToFile, har)
      })
    }
  })

  const runHar = () => {
    // Fetch.fulfillRequest makes Network.responseReceived report http/1.1 for
    // every fulfilled response, so the negotiated protocol never reaches the
    // HAR under CDP interception. Network.responseReceivedExtraInfo is emitted
    // from the network stack before interception swaps in the synthesized
    // response, so it still describes the real wire exchange: raw `headersText`
    // only exists for HTTP/1.1 responses (CDP cannot provide it for HTTP/2 or
    // HTTP/3).
    const wire = {
      responses: 0,
      http1_1StatusLines: 0,
    }

    // wait for Chrome to open, then start capturing
    return Promise.delay(500).then(() => {
      debug('Trying to connect to Chrome...')

      const captureHooks = createHarCaptureHooks(captureTimeoutMs)

      const harCapturer = HarCapturer.run([
        urlUnderTest,
      ], {
        port: cdpPort,
        // disable SSL verification on older Chrome versions, copied from the HAR CLI
        // https://github.com/cyrus-and/chrome-har-capturer/blob/587550508bddc23b7f4b4328c158322be4749298/bin/cli.js#L60
        preHook: (_, cdp) => {
          const { Security } = cdp

          captureHooks.trackNetworkActivity(cdp)

          cdp.on('Network.responseReceivedExtraInfo', (params) => {
            wire.responses++

            if (params.headersText && params.headersText.startsWith('HTTP/1.1')) {
              wire.http1_1StatusLines++
            }
          })

          return Security.enable().then(() => {
            return Security.setOverrideCertificateErrors({ override: true })
          })
          .then(() => {
            return Security.certificateError(({ eventId }) => {
              debug('EVENT ID', eventId)

              return Security.handleCertificateError({ eventId, action: 'continue' })
            })
          })
          .then(() => {
            if (!testCase.proxyDisabled) return

            // must run before Page.navigate so no request escapes interception —
            // har-capturer calls preHook, then Network.enable (which the runtime's
            // extra-info tracking relies on), then navigates
            return proxyDisabledServer.createCdpFetchNetworkRuntime(cdp)
          })
        },
        // capture stays open past the load event until enough requests have landed
        // https://github.com/cyrus-and/chrome-har-capturer/issues/59
        postHook: () => {
          return captureHooks.waitForEnoughRequests()
          .then(() => {
            if (!testCase.proxyDisabled) return

            // Fetch.disable needs the still-live tab client (har-capturer destroys
            // the tab only after postHook). Failure is tolerated — the next
            // createCdpFetchNetworkRuntime stops the previous runtime itself
            return Promise.resolve(proxyDisabledServer.stopCdpFetchRuntime()).catch(() => {})
          })
        },
      })

      return new Promise((resolve, reject) => {
        harCapturer.on('fail', (_, err) => {
          return reject(err)
        })

        harCapturer.on('har', resolve)
      })
      .then((har) => {
        debug('Received HAR from Chrome')
        debug('wire protocol evidence: %o', wire)

        if (onHar) onHar(har)

        if (onWire) onWire(wire)

        const results = getResultsFromHar(har)

        _.merge(testCase, results)

        return storeHar(testCase.name, har)
        .return(results)
      })
      .catch({ code: 'ECONNREFUSED' }, (err) => {
        // sometimes chrome takes surprisingly long, just reconn
        debug('Chrome connection failed: ', err)

        return runHar()
      })
    })
  }

  // every exit path has to reap Chrome, not just the one where a HAR arrives - a capture
  // that times out or fails would otherwise leave a process behind on each of the retries.
  // The ECONNREFUSED path reconnects to this same process, so this runs once it has settled.
  // SIGTERM first so Chrome closes its sockets cleanly — a hard kill RSTs hundreds of
  // kept-alive loopback sockets at once and the resets surface as uncaught ECONNRESETs
  // in the mocha process
  return runHar().finally(() => {
    proc.kill()
    setTimeout(() => proc.kill(9), 2000).unref()
  })
}

let cyServer
let proxyDisabledServer

describe('Proxy Performance', function () {
  // a retried test re-measures the baseline, so this has to cover two full captures
  this.timeout(2 * CAPTURE_TIMEOUT_MS + (30 * 1000))
  this.retries(3)

  beforeEach(function () {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    nock.enableNetConnect()
  })

  before(function () {
    // When this file runs after other specs (e.g. cy_visit_performance_spec.js loads first
    // alphabetically), the prior test's spec_helper `afterEach` has already run `clearCtx`.
    // Nested suite `before` runs before the next test's root `beforeEach`, so the global
    // DataContext is still unset here unless we call `setCtx` again.
    return Promise.resolve(clearCtx()).then(() => {
      setCtx(makeDataContext({}))
      const getFilesByGlob = getCtx().file.getFilesByGlob

      return CA.create()
      .then((ca) => {
        return ca.generateServerCertificateKeys('localhost')
      })
      .then(([cert, key]) => {
        return Promise.join(
          new DebuggingProxy().start(PROXY_PORT),

          new DebuggingProxy({
            https: { cert, key },
          }).start(HTTPS_PROXY_PORT),

          startLatencyOrigin(cert, key),

          setupFullConfigWithDefaults({
            projectRoot: '/tmp/a',
            config: {
              supportFile: false,
            },
          }, getFilesByGlob).then((config) => {
            config.port = CY_PROXY_PORT

            // turn off morgan
            config.morgan = false

            cyServer = new ServerBase(config)

            return cyServer.open(config, {
              SocketCtor: SocketE2E,
              createRoutes,
              testingType: 'e2e',
              getCurrentBrowser: () => null,
            })
            .then(() => {
              // killing Chrome between measurements resets browser<->proxy
              // sockets that may not have their own error handlers yet; an
              // extra listener keeps the reset from becoming an uncaught
              // exception without changing any handled path
              cyServer.server.on('connection', (socket) => socket.on('error', () => {}))
            })
          })
          .then(() => {
            return setupFullConfigWithDefaults({
              projectRoot: '/tmp/a',
              config: {
                supportFile: false,
              },
            }, getFilesByGlob)
          })
          .then((config) => {
            config.port = PROXY_DISABLED_CY_SERVER_PORT
            config.morgan = false

            proxyDisabledServer = new ServerBase(config)

            // the proxy-disabled open path (netStubbingState without a MITM
            // NetworkProxy, no httpsProxy, no MITM catch-all route) is gated on
            // this env var at open() time — cyServer above must open without it,
            // which is why these opens are sequenced instead of joined
            process.env.CYPRESS_INTERNAL_DISABLE_PROXY = '1'

            return Promise.resolve(proxyDisabledServer.open(config, {
              SocketCtor: SocketE2E,
              createRoutes,
              testingType: 'e2e',
              getCurrentBrowser: () => null,
            }))
            .finally(() => {
              delete process.env.CYPRESS_INTERNAL_DISABLE_PROXY
            })
          }),
        )
      })
    })
  })

  URLS_UNDER_TEST.map((urlUnderTest) => {
    // TODO: re-enable once the fixture is served from somewhere that tolerates the load the
    // hosted-page describes generate - 1000 requests and ~15MB per capture, 16 captures per
    // run, on every PR. GitHub Pages appears to throttle it: single requests to
    // test-page-speed.cypress.io are reliable, but a capture intermittently receives a Pages
    // error page instead of the fixture and then records 5 requests instead of 1001.
    // Unarchiving cypress-fetch-page and rebuilding it did not help. The synthetic latency
    // origin below is localhost, so it stays on.
    // https://github.com/cypress-io/cypress/issues/34530
    describe.skip(urlUnderTest, function () {
      // the fixture host does not always serve the fixture, and a load that missed it is
      // rejected in about a second, so retrying freely is what gets a run past a bad patch
      this.retries(15)

      let baseline
      const testCases = _.cloneDeep(TEST_CASES).filter((testCase) => {
        // HTTP/2 requires TLS, so those cases only run against the https URL
        return !(testCase.proxyDisabled || testCase.http2Control) || urlUnderTest.startsWith('https:')
      })

      before(function () {
        // run baseline test
        return runBrowserTest(urlUnderTest, testCases[0])
        .then((runtime) => {
          debug('baseline runtime is: ', runtime)

          baseline = runtime
        })
      })

      // slice(1) since first test is used as baseline above; the HTTP/2-focused
      // cases get dedicated tests below with their own assertions
      testCases.slice(1).filter((testCase) => !testCase.proxyDisabled && !testCase.http2Control).map((testCase) => {
        let multiplier = 3

        if (testCase.httpsUpstreamProxy) {
          // there is extra slowdown when the HTTPS upstream is used, so slightly increase the multiplier
          // maybe from higher CPU utilization with debugging-proxy and HTTPS
          multiplier *= 1.5
        }

        it(`${testCase.name} loads 1000 images less than ${multiplier}x as slowly as Chrome`, function () {
          debug('Current test: ', testCase.name)

          // On retry, re-measure baseline so the ratio stays paired in time with this
          // scenario. The `before`-hook baseline can drift relative to current machine
          // load on shared CI; without re-measuring, every retry compares against the
          // same stale baseline. Scoped locally so it doesn't leak to sibling tests.
          // Inside `it`, the running test is `this.test` (not `this.currentTest`,
          // which is only defined in hooks).
          const baselineForAttempt = this.test.currentRetry() === 0
            ? Promise.resolve(baseline)
            : runBrowserTest(urlUnderTest, testCases[0]).then((runtime) => {
              debug('re-measured baseline runtime is: ', runtime)

              return runtime
            })

          return baselineForAttempt.then((currentBaseline) => {
            return runBrowserTest(urlUnderTest, testCase).then((results) => {
              expect(results['Total']).to.be.lessThan(multiplier * currentBaseline['Total'])
            })
          })
        })
      })

      if (urlUnderTest.startsWith('https:')) {
        it('Chrome w/o Cypress (HTTP/2 control) negotiates HTTP/2 for 1000 images', async function () {
          const testCase = testCases.find((currentCase) => currentCase.http2Control)

          let har

          await runBrowserTest(urlUnderTest, testCase, { onHar: (capturedHar) => {
            har = capturedHar
          } })

          const versions = _.countBy(har.log.entries, 'response.httpVersion')

          debug('HTTP/2 control protocols: %o', versions)

          expect(versions['h2'] || 0, 'uninstrumented Chrome negotiated HTTP/2').to.be.at.least(1000)
        })

        it('With proxy disabled, Intercepted (CDP) preserves HTTP/2 and loads 1000 images within 2x of MITM interception', async function () {
          const proxyDisabledCase = testCases.find((testCase) => testCase.proxyDisabled && !testCase.disableHttp2)
          // clone so the generic MITM case's table row and .har artifact aren't clobbered
          const mitmCase = _.assign(
            _.cloneDeep(TEST_CASES.find((testCase) => testCase.name === 'With Cypress proxy, Intercepted')),
            { name: 'With Cypress proxy, Intercepted (paired re-measure)' },
          )

          let mitmWire
          let proxyDisabledWire

          // paired and time-adjacent: both sides re-measured on every retry so
          // machine-load drift can't skew the ratio
          const mitmResults = await runBrowserTest(urlUnderTest, mitmCase, { onWire: (wire) => {
            mitmWire = wire
          } })

          const proxyDisabledResults = await runBrowserTest(urlUnderTest, proxyDisabledCase, { onWire: (wire) => {
            proxyDisabledWire = wire
          } })

          debug('paired wire evidence: mitm %o proxy-disabled %o', mitmWire, proxyDisabledWire)
          debug('paired totals: mitm %d proxy-disabled %d', mitmResults['Total'], proxyDisabledResults['Total'])

          // through the MITM proxy every response arrives with an HTTP/1.1
          // status line; with the proxy disabled headersText is unavailable,
          // i.e. not HTTP/1.1 — with QUIC disabled and the control test
          // proving this Chrome + origin negotiate HTTP/2, that means HTTP/2
          expect(mitmWire.http1_1StatusLines, 'MITM responses received over HTTP/1.1').to.be.at.least(1000)
          expect(proxyDisabledWire.responses, 'proxy-disabled wire responses observed').to.be.at.least(1000)
          expect(proxyDisabledWire.http1_1StatusLines, 'proxy-disabled responses received over HTTP/1.1').to.eq(0)

          // 2x is a per-request pipeline-floor guard, not a speed race. Two
          // terms decide this comparison:
          //  - connection queueing, which scales with per-request latency
          //  - per-request pipeline cost, which doesn't
          // CI's datacenter-to-edge path has no meaningful latency, so the
          // queueing term goes to zero and only pipeline cost is left — MITM
          // can legitimately win. A strict HTTP/2-wins assertion would assert
          // that the term this network lacks dominates the one it has; it
          // lives on the synthetic latency origin instead
          expect(proxyDisabledResults['Total'], 'proxy-disabled HTTP/2 Total vs MITM intercepted Total').to.be.lessThan(2 * mitmResults['Total'])
        })

        it('With proxy disabled, Intercepted (CDP) w/o HTTP/2 loads 1000 images less than 3x as slowly as Chrome', async function () {
          const testCase = testCases.find((currentCase) => currentCase.proxyDisabled && currentCase.disableHttp2)
          // measured ~0.85x the baseline locally, so 3x (the suite's generic
          // multiplier) leaves ample headroom against CI noise while still
          // catching a real multiplied regression in the CDP HTTP/1.1 path
          const multiplier = 3

          const currentBaseline = this.test.currentRetry() === 0
            ? baseline
            : await runBrowserTest(urlUnderTest, testCases[0])

          let wireEvidence

          const results = await runBrowserTest(urlUnderTest, testCase, { onWire: (wire) => {
            wireEvidence = wire
          } })

          expect(wireEvidence.http1_1StatusLines, 'responses fell back to HTTP/1.1 on the wire').to.be.at.least(1000)
          expect(results['Total']).to.be.lessThan(multiplier * currentBaseline['Total'])
        })
      }

      after(() => {
        debug(`Done in ${Math.round((new Date() / 1000) - start)}s`)
        process.stdout.write('Note: All times are in milliseconds.\n')

        // eslint-disable-next-line no-console
        console.table(testCases)

        return Promise.map(testCases, (testCase) => {
          testCase['URL'] = urlUnderTest

          return performance.track('Proxy Performance', testCase)
        })
      })
    })
  })

  describe(`${HTTP2_LATENCY_ORIGIN_URL} (synthetic latency origin)`, function () {
    this.retries(RETRIES)
    // each test here is a paired measurement — two full captures per attempt
    this.timeout(2 * HTTP2_LATENCY_CAPTURE_TIMEOUT_MS + (30 * 1000))

    const mitmCase = makeTestCase({ name: 'With Cypress proxy, Intercepted', cyProxy: true, cyIntercept: true })
    const proxyDisabledCase = makeTestCase({ name: 'With proxy disabled, Intercepted (CDP)', proxyDisabled: true })
    const proxyDisabledNoH2Case = makeTestCase({ name: 'With proxy disabled, Intercepted (CDP) w/o HTTP/2', proxyDisabled: true, disableHttp2: true })

    before(async () => {
      // emitted before any measurement so a cell that never finishes a capture
      // still appears in the aggregated comparison as a failure mode rather than
      // as a missing row
      await recordBenchmark({ test: 'environment' })
    })

    after(() => {
      const testCases = [mitmCase, proxyDisabledCase, proxyDisabledNoH2Case]

      // eslint-disable-next-line no-console
      console.table(testCases)

      return Promise.map(testCases, (testCase) => {
        testCase['URL'] = HTTP2_LATENCY_ORIGIN_URL

        return performance.track('Proxy Performance', testCase)
      })
    })

    it('With proxy disabled, Intercepted (CDP) preserves HTTP/2 and loads 1000 delayed images faster than MITM interception', async function () {
      let mitmWire
      let proxyDisabledWire

      // paired and time-adjacent: both sides re-measured on every retry
      const mitmResults = await runBrowserTest(HTTP2_LATENCY_ORIGIN_URL, mitmCase, { captureTimeoutMs: HTTP2_LATENCY_CAPTURE_TIMEOUT_MS, onWire: (wire) => {
        mitmWire = wire
      } })

      const proxyDisabledResults = await runBrowserTest(HTTP2_LATENCY_ORIGIN_URL, proxyDisabledCase, { captureTimeoutMs: HTTP2_LATENCY_CAPTURE_TIMEOUT_MS, onWire: (wire) => {
        proxyDisabledWire = wire
      } })

      debug('latency-origin paired totals: mitm %d proxy-disabled %d', mitmResults['Total'], proxyDisabledResults['Total'])

      await recordBenchmark({
        test: 'cdp-h2-vs-mitm',
        mitmTotal: mitmResults['Total'],
        cdpTotal: proxyDisabledResults['Total'],
        cdpAvgWait: proxyDisabledResults['Avg Wait'],
        mitmAvgWait: mitmResults['Avg Wait'],
        h2Preserved: proxyDisabledWire.http1_1StatusLines === 0,
      })

      expect(mitmWire.http1_1StatusLines, 'MITM responses received over HTTP/1.1').to.be.at.least(1000)
      expect(proxyDisabledWire.responses, 'proxy-disabled wire responses observed').to.be.at.least(1000)
      expect(proxyDisabledWire.http1_1StatusLines, 'proxy-disabled responses received over HTTP/1.1').to.eq(0)

      // the injected per-response delay makes this hold in any environment:
      // ~6 HTTP/1.1 connections pay 1000 x delay / 6 in queueing, HTTP/2
      // multiplexing does not
      expectTiming(proxyDisabledResults['Total'], mitmResults['Total'], 'proxy-disabled HTTP/2 Total vs MITM intercepted Total')
    })

    it('With proxy disabled, Intercepted (CDP) w/o HTTP/2 loads 1000 delayed images within 2x of MITM interception', async function () {
      const pairedMitmCase = _.assign(_.cloneDeep(mitmCase), { name: 'With Cypress proxy, Intercepted (paired re-measure)' })

      let wireEvidence

      const mitmResults = await runBrowserTest(HTTP2_LATENCY_ORIGIN_URL, pairedMitmCase, { captureTimeoutMs: HTTP2_LATENCY_CAPTURE_TIMEOUT_MS })
      const results = await runBrowserTest(HTTP2_LATENCY_ORIGIN_URL, proxyDisabledNoH2Case, { captureTimeoutMs: HTTP2_LATENCY_CAPTURE_TIMEOUT_MS, onWire: (wire) => {
        wireEvidence = wire
      } })

      await recordBenchmark({
        test: 'cdp-no-h2-vs-mitm',
        mitmTotal: mitmResults['Total'],
        cdpNoH2Total: results['Total'],
      })

      expect(wireEvidence.http1_1StatusLines, 'responses fell back to HTTP/1.1 on the wire').to.be.at.least(1000)

      // both sides are connection-queueing-bound here; 2x bounds the CDP
      // pipeline's added per-request cost at equal protocol
      expectTiming(results['Total'], 2 * mitmResults['Total'], 'proxy-disabled w/o HTTP/2 Total vs 2x MITM intercepted Total')
    })
  })
})
