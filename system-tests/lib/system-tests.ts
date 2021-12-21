const snapshot = require('snap-shot-it')

import { SpawnOptions } from 'child_process'
import { expect } from './spec_helper'

require('mocha-banner').register()
const chalk = require('chalk').default
const _ = require('lodash')
let cp = require('child_process')
const path = require('path')
const http = require('http')
const human = require('human-interval')
const morgan = require('morgan')
const stream = require('stream')
const express = require('express')
const Bluebird = require('bluebird')
const debug = require('debug')('cypress:system-tests')
const httpsProxy = require('@packages/https-proxy')
const Fixtures = require('./fixtures')

const { allowDestroy } = require(`@packages/server/lib/util/server_destroy`)
const cypress = require(`@packages/server/lib/cypress`)
const screenshots = require(`@packages/server/lib/screenshots`)
const videoCapture = require(`@packages/server/lib/video_capture`)
const settings = require(`@packages/server/lib/util/settings`)

// mutates mocha test runner - needed for `test.titlePath`
// TODO: fix this - this mutates cwd and is strange in general
require(`@packages/server/lib/project-base`)

type CypressConfig = { [key: string]: any }

type BrowserName = 'electron' | 'firefox' | 'chrome'

type ExecResult = {
  code: number
  stdout: string
  stderr: string
}

type ExecFn = (options?: ExecOptions) => Promise<ExecResult>

type ItOptions = ExecOptions & {
  /**
   * If a function is supplied, it will be executed instead of running the `systemTests.exec` function immediately.
   */
  onRun?: (
    execFn: ExecFn
  ) => Promise<any> | any
  /**
   * Same as using `systemTests.it.only`.
   */
  only?: boolean
  /**
   * Same as using `systemTests.it.skip`.
   */
  skip?: boolean
}

type ExecOptions = {
  /**
   * Deprecated. Use `--cypress-inspect-brk` from command line instead.
   * @deprecated
   */
  inspectBrk?: null
  /**
   * Deprecated. Use `--no-exit` from command line instead.
   * @deprecated
   */
  exit?: null
  /**
   * Don't exit when tests are finished. You can also pass `--no-exit` via the command line.
   */
  noExit?: boolean
  /**
   * The browser to run the system tests on. By default, runs on all.
   */
  browser?: BrowserName | Array<BrowserName>
  /**
   * Test timeout in milliseconds.
   */
  timeout?: number
  /**
   * The spec argument to pass to Cypress.
   */
  spec?: string
  /**
   * The project fixture to scaffold and pass to Cypress.
   */
  project?: string
  /**
   * The testing type to use.
   */
  testingType?: 'e2e' | 'component'
  /**
   * If set, asserts that Cypress exited with the given exit code.
   * If all is working as it should, this is the number of failing tests.
   */
  expectedExitCode?: number
  /**
   * Force Cypress's server to use the specified port.
   */
  port?: number
  /**
   * Set headed mode. By default system tests run headlessly.
   */
  headed?: boolean
  /**
   * Set if the run should record. By default system tests do not record.
   */
  record?: boolean
  /**
   * Set additional command line args to be passed to the executable.
   */
  args?: string[]
  /**
   * If set, automatically snapshot the test's stdout.
   */
  snapshot?: boolean
  /**
   * Pass a function to assert on and/or modify the stdout before snapshotting.
   */
  onStdout?: (stdout: string) => string | void
  /**
   * User-supplied snapshot title. If unset, one will be autogenerated from the suite name.
   */
  originalTitle?: string
  /**
   * If set, screenshot dimensions will be sanitized for snapshotting purposes.
   * @default false
   */
  sanitizeScreenshotDimensions?: boolean
  /**
   * If set, the list of available browsers in stdout will be sanitized for snapshotting purposes.
   * @default true
   */
  normalizeStdoutAvailableBrowsers?: boolean
  /**
   * Runs Cypress in quiet mode.
   */
  quiet?: boolean
  /**
   * Run Cypress with parallelization.
   */
  parallel?: boolean
  /**
   * Run Cypress with run groups.
   */
  group?: string
  /**
   * Run Cypress with a CI build ID.
   */
  ciBuildId?: string
  /**
   * Run Cypress with a record key.
   */
  key?: string
  /**
   * Run Cypress with a custom Mocha reporter.
   */
  reporter?: string
  /**
   * Run Cypress with custom reporter options.
   */
  reporterOptions?: string
  /**
   * Run Cypress with CLI config.
   */
  config?: CypressConfig
  /**
   * Set Cypress env vars (not OS-level env)
   */
  env?: string
  /**
   * Set OS-level env vars.
   */
  processEnv?: { [key: string]: string | number }
  /**
   * Set an output path.
   */
  outputPath?: string
  /**
   * Set a run tag.
   */
  tag?: string
  /**
   * Run Cypress with a custom config filename.
   */
  configFile?: string
  /**
   * Set a custom executable to run instead of the default.
   */
  command?: string
  /**
   * Additional options to pass to `cp.spawn`.
   */
  spawnOpts?: SpawnOptions
  /**
   * Emulate a no-typescript environment.
   */
  noTypeScript?: boolean
  /**
   * Skip scaffolding the project and node_modules.
   */
  skipScaffold?: boolean
  /**
   * Run Cypress with a custom user node path.
   */
  userNodePath?: string
  /**
   * Run Cypress with a custom user node version.
   */
  userNodeVersion?: string
}

type Server = {
  /**
   * The port to listen on.
   */
  port: number
  /**
   * If set, use `@packages/https-proxy`'s CA to set up self-signed HTTPS.
   */
  https?: boolean
  /**
   * If set, use `express.static` middleware to serve the e2e project's static assets.
   */
  static?: boolean
  /**
   * If set, use the `cors` middleware to provide CORS headers.
   */
  cors?: boolean
  /**
   * A function that receives the Express app for setting up routes, etc.
   */
  onServer?: (app: Express.Application) => void
}

type SetupOptions = {
  servers?: Server | Array<Server>
  /**
   * Set default Cypress config.
   */
  settings?: CypressConfig
}

const serverPath = path.dirname(require.resolve('@packages/server'))

cp = Bluebird.promisifyAll(cp)

const env = _.clone(process.env)

Bluebird.config({
  longStackTraces: true,
})

const e2ePath = Fixtures.projectPath('e2e')
const pathUpToProjectName = Fixtures.projectPath('')

const DEFAULT_BROWSERS = ['electron', 'chrome', 'firefox']

const stackTraceLinesRe = /(\n?[^\S\n\r]*).*?(@|\bat\b)(?:.*node:.*|.*\.(js|coffee|ts|html|jsx|tsx))(-\d+)?:\d+:\d+[\n\S\s]*?(\n\s*?\n|$)/g
const browserNameVersionRe = /(Browser\:\s+)(Custom |)(Electron|Chrome|Canary|Chromium|Firefox)(\s\d+)(\s\(\w+\))?(\s+)/
const availableBrowsersRe = /(Available browsers found on your system are:)([\s\S]+)/g
const crossOriginErrorRe = /(Blocked a frame .* from accessing a cross-origin frame.*|Permission denied.*cross-origin object.*)/gm
const whiteSpaceBetweenNewlines = /\n\s+\n/
const retryDuration = /Timed out retrying after (\d+)ms/g
const escapedRetryDuration = /TORA(\d+)/g

export const STDOUT_DURATION_IN_TABLES_RE = /(\s+?)(\d+ms|\d+:\d+:?\d+)/g

// extract the 'Difference' section from a snap-shot-it error message
const diffRe = /Difference\n-{10}\n([\s\S]*)\n-{19}\nSaved snapshot text/m
const expectedAddedVideoSnapshotLines = [
  'Warning: We failed processing this video.',
  'This error will not alter the exit code.',
  'TimeoutError: operation timed out',
  '[stack trace lines]',
]
const expectedDeletedVideoSnapshotLines = [
  '(Video)',
  '-  Started processing:  Compressing to 32 CRF',
]
const sometimesAddedSpacingLine = ''
const sometimesAddedVideoSnapshotLine = '│ Video:        false                                                                            │'
const sometimesDeletedVideoSnapshotLine = '│ Video:        true                                                                             │'

const isVideoSnapshotError = (err: Error) => {
  const [added, deleted] = [[], []]
  const matches = diffRe.exec(err.message)

  if (!matches || !matches.length) {
    return false
  }

  const lines = matches[1].split('\n')

  for (const line of lines) {
    // past this point, the content is variable - mp4 path length
    if (line.includes('Finished processing:')) break

    if (line.charAt(0) === '+') added.push(line.slice(1).trim())

    if (line.charAt(0) === '-') deleted.push(line.slice(1).trim())
  }

  _.pull(added, sometimesAddedVideoSnapshotLine, sometimesAddedSpacingLine)
  _.pull(deleted, sometimesDeletedVideoSnapshotLine, sometimesAddedSpacingLine)

  return _.isEqual(added, expectedAddedVideoSnapshotLines) && _.isEqual(deleted, expectedDeletedVideoSnapshotLines)
}

// this captures an entire stack trace and replaces it with [stack trace lines]
// so that the stdout can contain stack traces of different lengths
// '@' will be present in firefox stack trace lines
// 'at' will be present in chrome stack trace lines
const replaceStackTraceLines = (str) => {
  return str.replace(stackTraceLinesRe, (match, ...parts) => {
    const isFirefoxStack = parts[1] === '@'
    let post = parts[4]

    if (isFirefoxStack) {
      post = post.replace(whiteSpaceBetweenNewlines, '\n')
    }

    return `\n      [stack trace lines]${post}`
  })
}

const replaceBrowserName = function (str, key, customBrowserPath, browserName, version, headless, whitespace) {
  // get the padding for the existing browser string
  const lengthOfExistingBrowserString = _.sum([browserName.length, version.length, _.get(headless, 'length', 0), whitespace.length])

  // this ensures we add whitespace so the border is not shifted
  return key + customBrowserPath + _.padEnd('FooBrowser 88', lengthOfExistingBrowserString)
}

const replaceDurationSeconds = function (str, p1, p2, p3, p4) {
  // get the padding for the existing duration
  const lengthOfExistingDuration = _.sum([(p2 != null ? p2.length : undefined) || 0, p3.length, p4.length])

  return p1 + _.padEnd('X seconds', lengthOfExistingDuration)
}

// duration='1589'
const replaceDurationFromReporter = (str, p1, p2, p3) => {
  return p1 + _.padEnd('X', p2.length, 'X') + p3
}

const replaceNodeVersion = (str, p1, p2, p3) => {
  // Accounts for paths that break across lines
  const p3Length = p3.includes('\n') ? p3.split('\n')[0].length - 1 : p3.length

  return _.padEnd(`${p1}X (/foo/bar/node)`, (p1.length + p2.length + p3Length))
}

const replaceCypressVersion = (str, p1, p2) => {
  // Cypress: 12.10.10 -> Cypress: 1.2.3 (handling padding)
  return _.padEnd(`${p1}1.2.3`, (p1.length + p2.length))
}

// when swapping out the duration, ensure we pad the
// full length of the duration so it doesn't shift content
const replaceDurationInTables = (str, p1, p2) => {
  return _.padStart('XX:XX', p1.length + p2.length)
}

// could be (1 second) or (10 seconds)
// need to account for shortest and longest
const replaceParenTime = (str, p1) => {
  return _.padStart('(X second)', p1.length)
}

const replaceScreenshotDims = (str, p1) => _.padStart('(YxX)', p1.length)

const replaceUploadingResults = function (orig, ...rest) {
  const adjustedLength = Math.max(rest.length, 2)
  const match = rest.slice(0, adjustedLength - 2)
  const results = match[1].split('\n').map((res) => res.replace(/\(\d+\/(\d+)\)/g, '(*/$1)'))
  .sort()
  .join('\n')
  const ret = match[0] + results + match[3]

  return ret
}

/**
 * Takes normalized runner STDOUT, finds the "Run Finished" line
 * and returns everything AFTER that, which usually is just the
 * test summary table.
 * @param {string} stdout from the test run, probably normalized
*/
const leaveRunFinishedTable = (stdout) => {
  const index = stdout.indexOf('  (Run Finished)')

  if (index === -1) {
    throw new Error('Cannot find Run Finished line')
  }

  return stdout.slice(index)
}

const normalizeStdout = function (str, options: any = {}) {
  const { normalizeStdoutAvailableBrowsers } = options

  // remove all of the dynamic parts of stdout
  // to normalize against what we expected
  str = str
  // /Users/jane/........../ -> //foo/bar/.projects/
  // (Required when paths are printed outside of our own formatting)
  .split(pathUpToProjectName).join('/foo/bar/.projects')

  // unless normalization is explicitly turned off then
  // always normalize the stdout replacing the browser text
  if (normalizeStdoutAvailableBrowsers !== false) {
    // usually we are not interested in the browsers detected on this particular system
    // but some tests might filter / change the list of browsers
    // in that case the test should pass "normalizeStdoutAvailableBrowsers: false" as options
    str = str.replace(availableBrowsersRe, '$1\n- browser1\n- browser2\n- browser3')
  }

  str = str
  .replace(browserNameVersionRe, replaceBrowserName)
  // numbers in parenths
  .replace(/\s\(\d+([ms]|ms)\)/g, '')
  // escape "Timed out retrying" messages
  .replace(retryDuration, 'TORA$1')
  // 12:35 -> XX:XX
  .replace(STDOUT_DURATION_IN_TABLES_RE, replaceDurationInTables)
  // restore "Timed out retrying" messages
  .replace(escapedRetryDuration, 'Timed out retrying after $1ms')
  .replace(/(coffee|js)-\d{3}/g, '$1-456')
  // Cypress: 2.1.0 -> Cypress: 1.2.3
  .replace(/(Cypress\:\s+)(\d+\.\d+\.\d+)/g, replaceCypressVersion)
  // Node Version: 10.2.3 (Users/jane/node) -> Node Version: X (foo/bar/node)
  .replace(/(Node Version\:\s+v)(\d+\.\d+\.\d+)( \((?:.|\n)*?\)\s+)/g, replaceNodeVersion)
  // 15 seconds -> X second
  .replace(/(Duration\:\s+)(\d+\sminutes?,\s+)?(\d+\sseconds?)(\s+)/g, replaceDurationSeconds)
  // duration='1589' -> duration='XXXX'
  .replace(/(duration\=\')(\d+)(\')/g, replaceDurationFromReporter)
  // (15 seconds) -> (XX seconds)
  .replace(/(\((\d+ minutes?,\s+)?\d+ seconds?\))/g, replaceParenTime)
  .replace(/\r/g, '')
  // replaces multiple lines of uploading results (since order not guaranteed)
  .replace(/(Uploading Results.*?\n\n)((.*-.*[\s\S\r]){2,}?)(\n\n)/g, replaceUploadingResults)
  // fix "Require stacks" for CI
  .replace(/^(\- )(\/.*\/packages\/server\/)(.*)$/gm, '$1$3')
  // Different browsers have different cross-origin error messages
  .replace(crossOriginErrorRe, '[Cross origin error message]')
  // Replaces connection warning since Firefox sometimes takes longer to connect
  .replace(/Still waiting to connect to Firefox, retrying in 1 second \(attempt .+\/.+\)/g, '')

  if (options.sanitizeScreenshotDimensions) {
    // screenshot dimensions
    str = str.replace(/(\(\d+x\d+\))/g, replaceScreenshotDims)
  }

  return replaceStackTraceLines(str)
}

const ensurePort = function (port) {
  if (port === 5566) {
    throw new Error('Specified port cannot be on 5566 because it conflicts with --inspect-brk=5566')
  }
}

const startServer = function (obj) {
  const { onServer, port, https } = obj

  ensurePort(port)

  const app = express()

  const srv = https ? httpsProxy.httpsServer(app) : new http.Server(app)

  allowDestroy(srv)

  app.use(morgan('dev'))

  if (obj.cors) {
    app.use(require('cors')())
  }

  if (obj.static) {
    app.use(express.static(path.join(__dirname, '../projects/e2e'), {}))
  }

  return new Bluebird((resolve) => {
    return srv.listen(port, () => {
      console.log(`listening on port: ${port}`)
      if (typeof onServer === 'function') {
        onServer(app, srv)
      }

      return resolve(srv)
    })
  })
}

const stopServer = (srv) => srv.destroyAsync()

const copy = function () {
  const ca = process.env.CIRCLE_ARTIFACTS

  debug('Should copy Circle Artifacts?', Boolean(ca))

  if (ca) {
    const videosFolder = path.join(e2ePath, 'cypress/videos')
    const screenshotsFolder = path.join(e2ePath, 'cypress/screenshots')

    debug('Copying Circle Artifacts', ca, videosFolder, screenshotsFolder)

    // copy each of the screenshots and videos
    // to artifacts using each basename of the folders
    return Bluebird.join(
      screenshots.copy(
        screenshotsFolder,
        path.join(ca, path.basename(screenshotsFolder)),
      ),
      videoCapture.copy(
        videosFolder,
        path.join(ca, path.basename(videosFolder)),
      ),
    )
  }
}

const getMochaItFn = function (only, skip, browser, specifiedBrowser) {
  // if we've been told to skip this test
  // or if we specified a particular browser and this
  // doesn't match the one we're currently trying to run...
  if (skip || (specifiedBrowser && (specifiedBrowser !== browser))) {
    // then skip this test
    return it.skip
  }

  if (only) {
    return it.only
  }

  return it
}

function getBrowsers (browserPattern) {
  if (!browserPattern.length) {
    return DEFAULT_BROWSERS
  }

  let selected = []

  const addBrowsers = _.clone(browserPattern)
  const removeBrowsers = _.remove(addBrowsers, (b) => b.startsWith('!')).map((b) => b.slice(1))

  if (removeBrowsers.length) {
    selected = _.without(DEFAULT_BROWSERS, ...removeBrowsers)
  } else {
    selected = _.intersection(DEFAULT_BROWSERS, addBrowsers)
  }

  if (!selected.length) {
    throw new Error(`options.browser: "${browserPattern}" matched no browsers`)
  }

  return selected
}

const normalizeToArray = (value) => {
  if (value && !_.isArray(value)) {
    return [value]
  }

  return value
}

const localItFn = function (title: string, opts: ItOptions) {
  opts.browser = normalizeToArray(opts.browser)

  const DEFAULT_OPTIONS = {
    only: false,
    skip: false,
    browser: [],
    snapshot: false,
    spec: 'no spec name supplied!',
    onStdout: _.noop,
    onRun (execFn, browser, ctx) {
      return execFn()
    },
  }

  const options = _.defaults({}, opts, DEFAULT_OPTIONS)

  if (!title) {
    throw new Error('systemTests.it(...) must be passed a title as the first argument')
  }

  // LOGIC FOR AUTO-GENERATING DYNAMIC TESTS
  // - create multiple tests for each default browser
  // - if browser is specified in options:
  //   ...skip the tests for each default browser if that browser
  //   ...does not match the specified one (used in CI)

  // run the tests for all the default browsers, or if a browser
  // has been specified, only run it for that
  const specifiedBrowser = process.env.BROWSER
  const browsersToTest = getBrowsers(options.browser)

  const browserToTest = function (browser) {
    const mochaItFn = getMochaItFn(options.only, options.skip, browser, specifiedBrowser)

    const testTitle = `${title} [${browser}]`

    return mochaItFn(testTitle, function () {
      if (options.useSeparateBrowserSnapshots) {
        title = testTitle
      }

      const originalTitle = this.test.parent.titlePath().concat(title).join(' / ')

      const ctx = this

      const execFn = (overrides = {}) => {
        return systemTests.exec(ctx, _.extend({ originalTitle }, options, overrides, { browser }))
      }

      return options.onRun(execFn, browser, ctx)
    })
  }

  return _.each(browsersToTest, browserToTest)
}

localItFn.only = function (title: string, options: ItOptions) {
  options.only = true

  return localItFn(title, options)
}

localItFn.skip = function (title: string, options: ItOptions) {
  options.skip = true

  return localItFn(title, options)
}

const maybeVerifyExitCode = (expectedExitCode, fn) => {
  // bail if this is explicitly null so
  // devs can turn off checking the exit code
  if (expectedExitCode === null) {
    return
  }

  return fn()
}

const systemTests = {

  replaceStackTraceLines,

  normalizeStdout,

  leaveRunFinishedTable,

  it: localItFn,

  snapshot (...args) {
    args = _.compact(args)

    // avoid snapshot cwd issue - see /patches/snap-shot* for more information
    global.CACHED_CWD_FOR_SNAP_SHOT_IT = path.join(__dirname, '..')

    return snapshot.apply(null, args)
  },

  setup (options: SetupOptions = {}) {
    beforeEach(async function () {
      // // after installing node modules copying all of the fixtures
      // // can take a long time (5-15 secs)
      // this.timeout(human('2 minutes'))

      Fixtures.remove()

      sinon.stub(process, 'exit')

      this.settings = options.settings

      if (options.servers) {
        const optsServers = [].concat(options.servers)

        const servers = await Bluebird.map(optsServers, startServer)

        this.servers = servers
      } else {
        this.servers = null
      }
    })

    afterEach(async function () {
      process.env = _.clone(env)

      this.timeout(human('2 minutes'))

      const s = this.servers

      if (s) {
        await Bluebird.map(s, stopServer)
      }
    })
  },

  options (ctx, options: ExecOptions) {
    if (options.inspectBrk != null) {
      throw new Error(`
      passing { inspectBrk: true } to system test options is no longer supported
      Please pass the --cypress-inspect-brk flag to the test command instead
      e.g. "yarn test async_timeouts_spec.js --cypress-inspect-brk"
      `)
    }

    _.defaults(options, {
      browser: 'electron',
      headed: process.env.HEADED || false,
      project: 'e2e',
      timeout: 120000,
      originalTitle: null,
      expectedExitCode: 0,
      sanitizeScreenshotDimensions: false,
      normalizeStdoutAvailableBrowsers: true,
      noExit: process.env.NO_EXIT,
      inspectBrk: process.env.CYPRESS_INSPECT_BRK,
    })

    const projectPath = Fixtures.projectPath(options.project)

    if (options.exit != null) {
      throw new Error(`
      passing { exit: false } to system test options is no longer supported
      Please pass the --no-exit flag to the test command instead
      e.g. "yarn test async_timeouts_spec.js --no-exit"
      `)
    }

    if (options.noExit && options.timeout < 3000000) {
      options.timeout = 3000000
    }

    ctx.timeout(options.timeout)

    const { spec } = options

    if (spec) {
      // normalize into array and then prefix
      const specs = spec.split(',').map((spec) => {
        if (path.isAbsolute(spec)) {
          return spec
        }

        const specDir = options.testingType === 'component' ? 'component' : 'integration'

        return path.join(projectPath, 'cypress', specDir, spec)
      })

      // normalize the path to the spec
      options.spec = specs.join(',')
    }

    return options
  },

  args (options: ExecOptions) {
    debug('converting options to args %o', { options })

    const args = [
      // hides a user warning to go through NPM module
      `--cwd=${serverPath}`,
      `--run-project=${Fixtures.projectPath(options.project)}`,
      `--testingType=${options.testingType || 'e2e'}`,
    ]

    if (options.spec) {
      args.push(`--spec=${options.spec}`)
    }

    if (options.port) {
      ensurePort(options.port)
      args.push(`--port=${options.port}`)
    }

    if (!_.isUndefined(options.headed)) {
      args.push('--headed', String(options.headed))
    }

    if (options.record) {
      args.push('--record')
    }

    if (options.quiet) {
      args.push('--quiet')
    }

    if (options.parallel) {
      args.push('--parallel')
    }

    if (options.group) {
      args.push(`--group=${options.group}`)
    }

    if (options.ciBuildId) {
      args.push(`--ci-build-id=${options.ciBuildId}`)
    }

    if (options.key) {
      args.push(`--key=${options.key}`)
    }

    if (options.reporter) {
      args.push(`--reporter=${options.reporter}`)
    }

    if (options.reporterOptions) {
      args.push(`--reporter-options=${options.reporterOptions}`)
    }

    if (options.browser) {
      args.push(`--browser=${options.browser}`)
    }

    if (options.config) {
      args.push('--config', JSON.stringify(options.config))
    }

    if (options.env) {
      args.push('--env', options.env)
    }

    if (options.outputPath) {
      args.push('--output-path', options.outputPath)
    }

    if (options.noExit) {
      args.push('--no-exit')
    }

    if (options.inspectBrk) {
      args.push('--inspect-brk')
    }

    if (options.tag) {
      args.push(`--tag=${options.tag}`)
    }

    if (options.configFile) {
      args.push(`--config-file=${options.configFile}`)
    }

    if (options.userNodePath) {
      args.push(`--userNodePath=${options.userNodePath}`)
    }

    if (options.userNodeVersion) {
      args.push(`--userNodeVersion=${options.userNodeVersion}`)
    }

    return args
  },

  start (ctx, options: ExecOptions) {
    options = this.options(ctx, options)
    const args = this.args(options)

    return cypress.start(args)
    .then(() => {
      const { expectedExitCode } = options

      maybeVerifyExitCode(expectedExitCode, () => {
        expect(process.exit).to.be.calledWith(expectedExitCode)
      })
    })
  },

  /**
   * Executes a given project and optionally sanitizes and checks output.
   * @example
    ```
      systemTests.setup()
      project = Fixtures.projectPath("component-tests")
      systemTests.exec(this, {
        project,
        config: {
          video: false
        }
      })
      .then (result) ->
        console.log(systemTests.normalizeStdout(result.stdout))
    ```
   */
  async exec (ctx, options: ExecOptions) {
    debug('systemTests.exec options %o', options)
    options = this.options(ctx, options)
    debug('processed options %o', options)
    let args = this.args(options)

    const specifiedBrowser = process.env.BROWSER

    if (specifiedBrowser && (![].concat(options.browser).includes(specifiedBrowser))) {
      ctx.skip()
    }

    if (!options.skipScaffold) {
      await Fixtures.scaffoldCommonNodeModules()
      Fixtures.scaffoldProject(options.project)
      await Fixtures.scaffoldProjectNodeModules(options.project)
    }

    if (process.env.NO_EXIT) {
      Fixtures.scaffoldWatch()
    }

    if (ctx.settings) {
      await settings.writeOnly(e2ePath, ctx.settings)
    }

    args = options.args || ['index.js'].concat(args)

    let stdout = ''
    let stderr = ''

    const exit = function (code) {
      const { expectedExitCode } = options

      maybeVerifyExitCode(expectedExitCode, () => {
        expect(code).to.eq(expectedExitCode, 'expected exit code')
      })

      // snapshot the stdout!
      if (options.snapshot) {
        // enable callback to modify stdout
        const ostd = options.onStdout

        if (ostd) {
          const newStdout = ostd(stdout)

          if (newStdout && _.isString(newStdout)) {
            stdout = newStdout
          }
        }

        // if we have browser in the stdout make
        // sure its legit
        const matches = browserNameVersionRe.exec(stdout)

        if (matches) {
          // eslint-disable-next-line no-unused-vars
          const [, , customBrowserPath, browserName, version, headless] = matches

          const { browser } = options

          if (browser && !customBrowserPath) {
            expect(_.capitalize(browser)).to.eq(browserName)
          }

          expect(parseFloat(version)).to.be.a.number

          // if we are in headed mode or headed is undefined in a browser other
          // than electron
          if (options.headed || (_.isUndefined(options.headed) && browser && browser !== 'electron')) {
            expect(headless).not.to.exist
          } else {
            expect(headless).to.include('(headless)')
          }
        }

        const str = normalizeStdout(stdout, options)

        try {
          if (options.originalTitle) {
            systemTests.snapshot(options.originalTitle, str, { allowSharedSnapshot: true })
          } else {
            systemTests.snapshot(str)
          }
        } catch (err) {
          // firefox has issues with recording video. for now, ignore snapshot diffs that only differ in this error.
          // @see https://github.com/cypress-io/cypress/pull/16731
          if (!(options.browser === 'firefox' && isVideoSnapshotError(err))) {
            throw err
          }

          console.log('(system tests warning) Firefox failed to process the video, but this is being ignored due to known issues with video processing in Firefox.')
        }
      }

      return {
        code,
        stdout,
        stderr,
      }
    }

    debug('spawning Cypress %o', { args })
    const cmd = options.command || 'node'
    const sp = cp.spawn(cmd, args, {
      env: _.chain(process.env)
      .omit('CYPRESS_DEBUG')
      .extend({
        // FYI: color will be disabled
        // because we are piping the child process
        COLUMNS: 100,
        LINES: 24,
      })
      .defaults({
        // match CircleCI's filesystem limits, so screenshot names in snapshots match
        CYPRESS_MAX_SAFE_FILENAME_BYTES: 242,
        FAKE_CWD_PATH: '/XXX/XXX/XXX',
        DEBUG_COLORS: '1',
        // prevent any Compression progress
        // messages from showing up
        VIDEO_COMPRESSION_THROTTLE: 120000,

        // don't fail our own tests running from forked PR's
        CYPRESS_INTERNAL_SYSTEM_TESTS: '1',

        // Emulate no typescript environment
        CYPRESS_INTERNAL_NO_TYPESCRIPT: options.noTypeScript ? '1' : '0',

        // disable frame skipping to make quick Chromium tests have matching snapshots/working video
        CYPRESS_EVERY_NTH_FRAME: 1,

        // force file watching for use with --no-exit
        ...(options.noExit ? { CYPRESS_INTERNAL_FORCE_FILEWATCH: '1' } : {}),
      })
      .extend(options.processEnv)
      .value(),
      ...options.spawnOpts,
    })

    const ColorOutput = function () {
      const colorOutput = new stream.Transform()

      colorOutput._transform = (chunk, encoding, cb) => cb(null, chalk.magenta(chunk.toString()))

      return colorOutput
    }

    // pipe these to our current process
    // so we can see them in the terminal
    // color it so we can tell which is test output
    sp.stdout
    .pipe(ColorOutput())
    .pipe(process.stdout)

    sp.stderr
    .pipe(ColorOutput())
    .pipe(process.stderr)

    sp.stdout.on('data', (buf) => stdout += buf.toString())
    sp.stderr.on('data', (buf) => stderr += buf.toString())

    const exitCode = await new Promise((resolve, reject) => {
      sp.on('error', reject)
      sp.on('exit', resolve)
    })

    await copy()

    return exit(exitCode)
  },

  sendHtml (contents) {
    return function (req, res) {
      res.set('Content-Type', 'text/html')

      return res.send(`\
<!DOCTYPE html>
<html lang="en">
<body>
  ${contents}
</body>
</html>\
`)
    }
  },

  normalizeWebpackErrors (stdout) {
    return stdout
    .replace(/using description file: .* \(relative/g, 'using description file: [..] (relative')
    .replace(/Module build failed \(from .*\)/g, 'Module build failed (from [..])')
  },

  normalizeRuns (runs) {
    runs.forEach((run) => {
      run.tests.forEach((test) => {
        test.attempts.forEach((attempt) => {
          const codeFrame = attempt.error && attempt.error.codeFrame

          if (codeFrame) {
            codeFrame.absoluteFile = codeFrame.absoluteFile.split(pathUpToProjectName).join('/foo/bar/.projects')
          }
        })
      })
    })

    return runs
  },
}

export {
  systemTests as default,
  expect,
}
