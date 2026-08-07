require('../spec_helper')

const { getCtx, setCtx, makeDataContext, clearCtx } = require('../../lib/makeDataContext')

const cp = require('child_process')
const fse = require('fs-extra')
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
const CDP_PORT = 45679 /** port range starts here, not the actual port */
const CY_PROXY_PORT = 45680

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
].map((v) => {
  // fill in all the fields so the keys are in the correct order for readability
  return _.defaults(v, {
    disableHttp2: false,
    upstreamProxy: false,
    httpsUpstreamProxy: false,
    cyProxy: false,
    cyIntercept: false,
  })
})

const EXPECTED_IMAGE_COUNT = 1000

// The fixture fires 1000 `fetch()` calls from an inline script and contains no `<img>`
// elements, so `Page.loadEventFired` - the only completion signal chrome-har-capturer waits
// for - lands while every image is still outstanding. Requests that have not produced a
// `Network.loadingFinished` by the time capture stops are dropped from the HAR rather than
// recorded as failures, so capture has to stay open until enough of them have landed.
const CAPTURE_TIMEOUT_MS = Number(process.env.PROXY_PERF_CAPTURE_TIMEOUT) || 15000

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

const createHarCaptureHooks = () => {
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
        failed.add(params.requestId)
        break
      case 'Network.loadingFinished':
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
            reject(new Error(`Timed out after ${CAPTURE_TIMEOUT_MS}ms waiting for ${EXPECTED_IMAGE_COUNT} requests to finish loading. ${describeCapture()}`))
          }, CAPTURE_TIMEOUT_MS)

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

const runBrowserTest = (urlUnderTest, testCase) => {
  const cdpPort = CDP_PORT + Math.round(Math.random() * 10000)

  const browser = {
    isHeadless: true,
  }

  const options = {}

  const args = _getArgs(browser, options, cdpPort).concat([
    // additionally...
    '--disable-background-networking',
    '--no-sandbox', // allows us to run as root, for CI
    `--user-data-dir=${fse.mkdtempSync(path.join(os.tmpdir(), 'cy-perf-'))}`,
  ])

  if (testCase.disableHttp2) {
    args.push('--disable-http2')
  }

  if (testCase.cyProxy) {
    args.push(`--proxy-server=http://localhost:${CY_PROXY_PORT}`)
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
    // wait for Chrome to open, then start capturing
    return Promise.delay(500).then(() => {
      debug('Trying to connect to Chrome...')

      const captureHooks = createHarCaptureHooks()

      const harCapturer = HarCapturer.run([
        urlUnderTest,
      ], {
        port: cdpPort,
        // disable SSL verification on older Chrome versions, copied from the HAR CLI
        // https://github.com/cyrus-and/chrome-har-capturer/blob/587550508bddc23b7f4b4328c158322be4749298/bin/cli.js#L60
        preHook: (_, cdp) => {
          const { Security } = cdp

          captureHooks.trackNetworkActivity(cdp)

          return Security.enable().then(() => {
            return Security.setOverrideCertificateErrors({ override: true })
          })
          .then(() => {
            return Security.certificateError(({ eventId }) => {
              debug('EVENT ID', eventId)

              return Security.handleCertificateError({ eventId, action: 'continue' })
            })
          })
        },
        // capture stays open past the load event until enough requests have landed
        // https://github.com/cyrus-and/chrome-har-capturer/issues/59
        postHook: () => {
          return captureHooks.waitForEnoughRequests()
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
  return runHar().finally(() => proc.kill(9))
}

let cyServer

// TODO: re-enable once the fixture is served from somewhere that tolerates the load this
// suite generates - 1000 requests and ~15MB per capture, 16 captures per run, on every PR.
// GitHub Pages appears to throttle it: single requests to test-page-speed.cypress.io are
// reliable, but a capture intermittently receives a Pages error page instead of the fixture
// and then records 5 requests instead of 1001. Unarchiving cypress-fetch-page and rebuilding
// it did not help. https://github.com/cypress-io/cypress/issues/TODO
describe.skip('Proxy Performance', function () {
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
          }),
        )
      })
    })
  })

  URLS_UNDER_TEST.map((urlUnderTest) => {
    describe(urlUnderTest, function () {
      // the fixture host does not always serve the fixture, and a load that missed it is
      // rejected in about a second, so retrying freely is what gets a run past a bad patch
      this.retries(15)

      let baseline
      const testCases = _.cloneDeep(TEST_CASES)

      before(function () {
        // run baseline test
        return runBrowserTest(urlUnderTest, testCases[0])
        .then((runtime) => {
          debug('baseline runtime is: ', runtime)

          baseline = runtime
        })
      })

      // slice(1) since first test is used as baseline above
      testCases.slice(1).map((testCase) => {
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
})
