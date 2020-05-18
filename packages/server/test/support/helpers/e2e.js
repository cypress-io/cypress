require('../../spec_helper')
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
const Promise = require('bluebird')
const snapshot = require('snap-shot-it')
const debug = require('debug')('cypress:support:e2e')
const httpsProxy = require('@packages/https-proxy')
const Fixtures = require('./fixtures')
const fs = require(`${root}../lib/util/fs`)
const allowDestroy = require(`${root}../lib/util/server_destroy`)
const cypress = require(`${root}../lib/cypress`)
const screenshots = require(`${root}../lib/screenshots`)
const videoCapture = require(`${root}../lib/video_capture`)
const settings = require(`${root}../lib/util/settings`)

// mutates mocha test runner - needed for `test.titlePath`
require(`${root}../lib/project`)

cp = Promise.promisifyAll(cp)

const env = _.clone(process.env)

Promise.config({
  longStackTraces: true,
})

const e2ePath = Fixtures.projectPath('e2e')
const pathUpToProjectName = Fixtures.projectPath('')

const DEFAULT_BROWSERS = ['electron', 'chrome', 'firefox']

const stackTraceLinesRe = /(\n?[^\S\n\r]*).*?(@|\bat\b).*\.(js|coffee|ts|html|jsx|tsx)(-\d+)?:\d+:\d+[\n\S\s]*?(\n\s*?\n|$)/g
const browserNameVersionRe = /(Browser\:\s+)(Custom |)(Electron|Chrome|Canary|Chromium|Firefox)(\s\d+)(\s\(\w+\))?(\s+)/
const availableBrowsersRe = /(Available browsers found are: )(.+)/g
const crossOriginErrorRe = /(Blocked a frame .* from accessing a cross-origin frame.*|Permission denied.*cross-origin object.*)/gm
const whiteSpaceBetweenNewlines = /\n\s+\n/

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

const replaceNodeVersion = (str, p1, p2, p3) => _.padEnd(`${p1}X (/foo/bar/node)`, (p1.length + p2.length + p3.length))

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

const normalizeStdout = function (str, options = {}) {
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
    str = str.replace(availableBrowsersRe, '$1browser1, browser2, browser3')
  }

  str = str
  .replace(browserNameVersionRe, replaceBrowserName)
  // numbers in parenths
  .replace(/\s\(\d+([ms]|ms)\)/g, '')
  // 12:35 -> XX:XX
  .replace(/(\s+?)(\d+ms|\d+:\d+:?\d+)/g, replaceDurationInTables)
  .replace(/(coffee|js)-\d{3}/g, '$1-456')
  // Cypress: 2.1.0 -> Cypress: 1.2.3
  .replace(/(Cypress\:\s+)(\d\.\d\.\d)/g, '$11.2.3')
  // Node Version: 10.2.3 (Users/jane/node) -> Node Version: X (foo/bar/node)
  .replace(/(Node Version\:\s+v)(\d+\.\d+\.\d+)( \(.*\)\s+)/g, replaceNodeVersion)
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

  const s = obj.static

  if (s) {
    const opts = _.isObject(s) ? s : {}

    app.use(express.static(e2ePath, opts))
  }

  return new Promise((resolve) => {
    return srv.listen(port, () => {
      // eslint-disable-next-line no-console
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
    return Promise.join(
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

const localItFn = function (title, opts = {}) {
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
    throw new Error('e2e.it(...) must be passed a title as the first argument')
  }

  // LOGIC FOR AUTOGENERATING DYNAMIC TESTS
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
        return e2e.exec(ctx, _.extend({ originalTitle }, options, overrides, { browser }))
      }

      return options.onRun(execFn, browser, ctx)
    })
  }

  return _.each(browsersToTest, browserToTest)
}

localItFn.only = function (title, options) {
  options.only = true

  return localItFn(title, options)
}

localItFn.skip = function (title, options) {
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

const e2e = {

  replaceStackTraceLines,

  normalizeStdout,

  leaveRunFinishedTable,

  it: localItFn,

  snapshot (...args) {
    args = _.compact(args)

    return snapshot.apply(null, args)
  },

  setup (options = {}) {
    // cleanup old node_modules that may have been around from legacy tests
    before(() => {
      return fs.removeAsync(Fixtures.path('projects/e2e/node_modules'))
    })

    beforeEach(async function () {
      // after installing node modules copying all of the fixtures
      // can take a long time (5-15 secs)
      this.timeout(human('2 minutes'))
      Fixtures.scaffold()

      if (process.env.NO_EXIT) {
        Fixtures.scaffoldWatch()
        process.env.CYPRESS_INTERNAL_E2E_TESTS
      }

      sinon.stub(process, 'exit')

      if (options.servers) {
        const optsServers = [].concat(options.servers)

        const servers = await Promise.map(optsServers, startServer)

        this.servers = servers
      } else {
        this.servers = null
      }

      const s = options.settings

      if (s) {
        await settings.write(e2ePath, s)
      }
    })

    afterEach(async function () {
      process.env = _.clone(env)

      this.timeout(human('2 minutes'))

      Fixtures.remove()

      const s = this.servers

      if (s) {
        await Promise.map(s, stopServer)
      }
    })
  },

  options (ctx, options = {}) {
    const noExit = process.env.NO_EXIT

    _.defaults(options, {
      browser: 'electron',
      headed: process.env.HEADED || false,
      project: e2ePath,
      timeout: 120000,
      originalTitle: null,
      expectedExitCode: 0,
      sanitizeScreenshotDimensions: false,
      normalizeStdoutAvailableBrowsers: true,
      noExit,
    })

    if (options.exit != null) {
      throw new Error(`
      passing { exit: false } to e2e options is no longer supported
      Please pass the --no-exit flag to the test command instead
      e.g. "yarn test test/e2e/1_async_timeouts_spec.coffee --no-exit"
      `)
    }

    if (noExit && options.timeout < 3000000) {
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

        // TODO would not work for component tests
        return path.join(options.project, 'cypress', 'integration', spec)
      })

      // normalize the path to the spec
      options.spec = specs.join(',')
    }

    return options
  },

  args (options = {}) {
    debug('converting options to args %o', { options })

    const args = [
      // hides a user warning to go through NPM module
      `--cwd=${process.cwd()}`,
      `--run-project=${options.project}`,
    ]

    if (options.spec) {
      args.push(`--spec=${options.spec}`)
    }

    if (options.port) {
      ensurePort(options.port)
      args.push(`--port=${options.port}`)
    }

    if (!_.isUndefined(options.headed)) {
      args.push('--headed', options.headed)
    }

    if (options.record) {
      args.push('--record')
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

    return args
  },

  start (ctx, options = {}) {
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
      e2e.setup()
      project = Fixtures.projectPath("component-tests")
      e2e.exec(this, {
        project,
        config: {
          video: false
        }
      })
      .then (result) ->
        console.log(e2e.normalizeStdout(result.stdout))
    ```
   */
  exec (ctx, options = {}) {
    debug('e2e exec options %o', options)
    options = this.options(ctx, options)
    debug('processed options %o', options)
    let args = this.args(options)

    args = ['index.js'].concat(args)

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

          if (_.isString(newStdout)) {
            stdout = newStdout
          }
        }

        // if we have browser in the stdout make
        // sure its legit
        const matches = browserNameVersionRe.exec(stdout)

        if (matches) {
          // eslint-disable-next-line no-unused-vars
          const [str, key, customBrowserPath, browserName, version, headless] = matches

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

        if (options.originalTitle) {
          snapshot(options.originalTitle, str, { allowSharedSnapshot: true })
        } else {
          snapshot(str)
        }
      }

      return {
        code,
        stdout,
        stderr,
      }
    }

    return new Promise((resolve, reject) => {
      debug('spawning Cypress %o', { args })
      const sp = cp.spawn('node', args, {
        env: _.chain(process.env)
        .omit('CYPRESS_DEBUG')
        .extend({
          // FYI: color will be disabled
          // because we are piping the child process
          COLUMNS: 100,
          LINES: 24,
        })
        .defaults({
          FAKE_CWD_PATH: '/XXX/XXX/XXX',
          DEBUG_COLORS: '1',
          // prevent any Compression progress
          // messages from showing up
          VIDEO_COMPRESSION_THROTTLE: 120000,

          // don't fail our own tests running from forked PR's
          CYPRESS_INTERNAL_E2E_TESTS: '1',

          // Emulate no typescript environment
          CYPRESS_INTERNAL_NO_TYPESCRIPT: options.noTypeScript ? '1' : '0',

          // force file watching for use with --no-exit
          ...(options.noExit ? { CYPRESS_INTERNAL_FORCE_FILEWATCH: '1' } : {}),
        })
        .extend(options.processEnv)
        .value(),
      })

      const ColorOutput = function () {
        const colorOutput = new stream.Transform()

        colorOutput._transform = (chunk, encoding, cb) => cb(null, chalk.magenta(chunk.toString()))

        return colorOutput
      }

      // pipe these to our current process
      // so we can see them in the terminal
      // color it so we can tell which is test output
      sp.stdout.pipe(ColorOutput()).pipe(process.stdout)
      sp.stderr.pipe(ColorOutput()).pipe(process.stderr)

      sp.stdout.on('data', (buf) => stdout += buf.toString())
      sp.stderr.on('data', (buf) => stderr += buf.toString())
      sp.on('error', reject)

      return sp.on('exit', resolve)
    }).tap(copy)
    .then(exit)
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
}

module.exports = e2e
