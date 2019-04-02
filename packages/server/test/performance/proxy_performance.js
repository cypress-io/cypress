const cp = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const _ = require('lodash')
const { it, after, before, beforeEach, describe } = require('mocha')
const { expect } = require('chai')
const debug = require('debug')('test:proxy-performance')
const DebuggingProxy = require('@cypress/debugging-proxy')
const HarCapturer = require('chrome-har-capturer')
const Promise = require('bluebird')
const Table = require('console-table-printer').Table

process.env.CYPRESS_ENV = 'development'

const CA = require('@packages/https-proxy').CA
const Config = require('../../lib/config')
const Server = require('../../lib/server')
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
  // {
  //   name: 'Chrome w/o HTTP/2',
  //   disableHttp2: true,
  // },
  // these 5 test cases cover Chrome, useful only for comparison
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
  {
    name: 'Chrome w/ proxy w/o HTTP/2 (baseline)',
    disableHttp2: true,
    upstreamProxy: true,
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
    name: 'With Cypress proxy, Intercepted',
    cyProxy: true,
    cyIntercept: true,
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
]

let defaultArgs = _getArgs()

// additionally...
defaultArgs = defaultArgs.concat([
  '--headless',
  '--disable-background-networking',
  '--no-sandbox', // allows us to run as root, for CI
])

const getResultsFromHar = (har, testCase) => {
  // HAR 1.2 Spec:
  // http://www.softwareishard.com/blog/har-12-spec/
  const { entries } = har.log

  const first = entries[0]
  const last = entries[entries.length - 1]
  const elapsed = Number(new Date(last.startedDateTime)) + last.time - Number(new Date(first.startedDateTime))

  testCase['Total'] = `${Math.round(elapsed)}ms`

  let mins = {}
  let maxes = {}

  const aggTimings = entries.reduce((prev, cur) => {
    cur = cur.timings
    Object.keys(cur).forEach((timingKey) => {
      if (cur[timingKey] === -1) return

      const ms = Math.round(cur[timingKey])

      if (!mins[timingKey] || ms < mins[timingKey]) mins[timingKey] = ms

      if (!maxes[timingKey] || ms > maxes[timingKey]) maxes[timingKey] = ms

      if (!prev[timingKey]) prev[timingKey] = ms
      else prev[timingKey] += ms
    })

    return prev
  }, {})

  Object.keys(aggTimings).forEach((timingKey) => {
    if (!['receive', 'wait', 'send'].find((x) => {
      return x === timingKey
    })) return

    testCase[`Avg ${timingKey}`] = `${Math.round(aggTimings[timingKey] / entries.length)}ms`
  })
}

const runBrowserTest = (urlUnderTest, testCase) => {
  const cdpPort = CDP_PORT + Math.round(Math.random() * 10000)

  let args = defaultArgs.concat([
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'cy-perf-'))}`,
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
    cyServer._onDomainSet(urlUnderTest)
  } else {
    cyServer._onDomainSet('<root>')
  }

  let cmd = CHROME_PATH

  debug('Launching Chrome: ', cmd, args.join(' '))

  const proc = cp.spawn(cmd, args, {
    stdio: 'ignore',
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
      .catch((err) => {
        // sometimes chrome takes surprisingly long, just reconn
        debug('Chrome connection failed: ', err)

        return runHar()
      })
      .then((har) => {
        proc.kill(9)
        debug('Received HAR from Chrome')
        getResultsFromHar(har, testCase)

        const runtime = Number(testCase['Total'].replace('ms', ''))

        return runtime
      })
    })
  }

  return runHar()
}

let cyServer

describe('Proxy Performance', function () {
  this.timeout(120 * 1000)

  beforeEach(function () {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  })

  before(function () {
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

        Config.set({
          projectRoot: '/tmp/a',
        }).then((config) => {
          config.port = CY_PROXY_PORT
          cyServer = Server()

          return cyServer.open(config)
        })
      )
    })
  })

  URLS_UNDER_TEST.map((urlUnderTest) => {
    const testCases = _.cloneDeep(TEST_CASES)

    describe(urlUnderTest, function () {
      let baseline

      before(function () {
        // run baseline test
        return runBrowserTest(urlUnderTest, testCases[0])
        .then((runtime) => {
          baseline = runtime
        })
      })

      testCases.slice(1).map((testCase) => {
        it(`${testCase.name} loads 1000 images in less than 1.5x the speed of regular Chrome`, function () {
          debug('Current test: ', testCase.name)

          return runBrowserTest(urlUnderTest, testCase)
          .then((runtime) => {
            expect(runtime).to.be.lessThan(baseline * 1.5)
          })
        })
      })

      after(() => {
        debug(`Done in ${Math.round((new Date() / 1000) - start)}s`)
        // console.table has forsaken us :(
        const t = new Table()

        t.addRows(testCases)
        t.printTable()
      })
    })
  })
})
