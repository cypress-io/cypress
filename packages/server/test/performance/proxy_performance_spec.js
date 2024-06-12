require('../spec_helper')

const { makeDataContext, setCtx, getCtx } = require('../../lib/makeDataContext')

setCtx(makeDataContext({}))

const cp = require('child_process')
const fse = require('fs-extra')
const os = require('os')
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

const CA = require('@packages/https-proxy').CA
const { setupFullConfigWithDefaults } = require('@packages/config')
const { ServerBase } = require('../../lib/server-base')
const { SocketE2E } = require('../../lib/socket-e2e')
const { _getArgs } = require('../../lib/browsers/chrome')

const CHROME_PATH = 'google-chrome'
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

  expect(timings.total.length).to.be.at.least(1000)

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

      const harCapturer = HarCapturer.run([
        urlUnderTest,
      ], {
        port: cdpPort,
        // disable SSL verification on older Chrome versions, copied from the HAR CLI
        // https://github.com/cyrus-and/chrome-har-capturer/blob/587550508bddc23b7f4b4328c158322be4749298/bin/cli.js#L60
        preHook: (_, cdp) => {
          const { Security } = cdp

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
        // wait til all data is done before finishing
        // https://github.com/cyrus-and/chrome-har-capturer/issues/59
        postHook: (_, cdp) => {
          let timeout

          return new Promise((resolve) => {
            cdp.on('event', (message) => {
              if (message.method === 'Network.dataReceived') {
                // reset timer
                clearTimeout(timeout)
                timeout = setTimeout(resolve, 1000)
              }
            })
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
        proc.kill(9)
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

  return runHar()
}

let cyServer

describe('Proxy Performance', function () {
  this.timeout(60 * 1000)
  this.retries(3)

  beforeEach(function () {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    nock.enableNetConnect()
  })

  before(function () {
    setCtx(makeDataContext({}))

    const getFilesByGlob = getCtx().file.getFilesByGlob

    return CA.create()
    .then((ca) => {
      return ca.generateServerCertificateKeys('localhost')
    })
    .spread((cert, key) => {
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

          cyServer = new ServerBase()

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

  URLS_UNDER_TEST.map((urlUnderTest) => {
    // TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23214
    describe(urlUnderTest, { retries: 15 }, function () {
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

          return runBrowserTest(urlUnderTest, testCase)
          .then((results) => {
            expect(results['Total']).to.be.lessThan(multiplier * baseline['Total'])
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
