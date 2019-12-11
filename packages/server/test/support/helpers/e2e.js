let e2e

require('../../spec_helper')

const _ = require('lodash')
let cp = require('child_process')
const niv = require('npm-install-version')
const path = require('path')
const http = require('http')
const human = require('human-interval')
const morgan = require('morgan')
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

const DEFAULT_BROWSERS = ['electron', 'chrome']

const stackTraceLinesRe = /(\n?\s*).*?(@|at).*\.(js|coffee|ts|html|jsx|tsx)(-\d+)?:\d+:\d+[\n\S\s]*?(\n\s*\n|$)/g
const browserNameVersionRe = /(Browser\:\s+)(Custom |)(Electron|Chrome|Canary|Chromium|Firefox)(\s\d+)(\s\(\w+\))?(\s+)/
const availableBrowsersRe = /(Available browsers found are: )(.+)/g

// this captures an entire stack trace and replaces it with [stack trace lines]
// so that the stdout can contain stack traces of different lengths
// '@' will be present in firefox stack trace lines
// 'at' will be present in chrome stack trace lines
const replaceStackTraceLines = (str) => str.replace(stackTraceLinesRe, '$1[stack trace lines]$5')

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

const normalizeStdout = function (str, options = {}) {
  const normalizeOptions = _.defaults({}, options, { normalizeAvailableBrowsers: true })

  // remove all of the dynamic parts of stdout
  // to normalize against what we expected
  str = str
  // /Users/jane/........../ -> //foo/bar/.projects/
  // (Required when paths are printed outside of our own formatting)
  .split(pathUpToProjectName).join('/foo/bar/.projects')

  if (normalizeOptions.normalizeAvailableBrowsers) {
    // usually we are not interested in the browsers detected on this particular system
    // but some tests might filter / change the list of browsers
    // in that case the test should pass "normalizeAvailableBrowsers:false" as options
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
  let s; let srv
  const { onServer, port, https } = obj

  ensurePort(port)

  const app = express()

  if (https) {
    srv = httpsProxy.httpsServer(app)
  } else {
    srv = http.Server(app)
  }

  allowDestroy(srv)

  app.use(morgan('dev'))

  s = obj.static

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
        path.join(ca, path.basename(screenshotsFolder))
      ),
      videoCapture.copy(
        videosFolder,
        path.join(ca, path.basename(videosFolder))
      )
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

const getBrowsers = function (generateTestsForDefaultBrowsers, browser, defaultBrowsers) {
  // if we're generating tests for default browsers
  if (generateTestsForDefaultBrowsers) {
    // then return an array of default browsers
    return defaultBrowsers
  }

  // but if we haven't been told to generate tests for default browsers
  // and weren't provided a specified browser then throw
  if (!browser) {
    throw new Error('A browser must be specified when { generateTestsForDefaultBrowsers: false }.')
  }

  // otherwise return the specified browser
  return [browser]
}

const localItFn = function (title, options = {}) {
  options = _
  .chain(options)
  .clone()
  .defaults({
    only: false,
    skip: false,
    browser: process.env.BROWSER,
    generateTestsForDefaultBrowsers: true,
    onRun (execFn, browser, ctx) {
      return execFn()
    },
  })
  .value()

  const { only, skip, browser, generateTestsForDefaultBrowsers, onRun } = options

  if (!title) {
    throw new Error('e2e.it(...) must be passed a title as the first argument')
  }

  // LOGIC FOR AUTOGENERATING DYNAMIC TESTS
  // - if generateTestsForDefaultBrowsers
  //   - create multiple tests for each default browser
  //   - if browser is specified in options:
  //     ...skip the tests for each default browser if that browser
  //     ...does not match the specified one (used in CI)
  // - else only generate a single test with the specified browser

  // run the tests for all the default browsers, or if a browser
  // has been specified, only run it for that
  const specifiedBrowser = browser
  const browsersToTest = getBrowsers(generateTestsForDefaultBrowsers, browser, DEFAULT_BROWSERS)

  const browserToTest = function (browser) {
    const mochaItFn = getMochaItFn(only, skip, browser, specifiedBrowser)

    const testTitle = `${title} [${browser}]`

    return mochaItFn(testTitle, function () {
      const originalTitle = this.test.parent.titlePath().concat(title).join(' / ')

      const ctx = this

      const execFn = (overrides = {}) => e2e.exec(ctx, _.extend({ originalTitle }, options, overrides, { browser }))

      return onRun(execFn, browser, ctx)
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

module.exports = (e2e = {
  normalizeStdout,

  it: localItFn,

  snapshot (...args) {
    args = _.compact(args)

    // grab the last element in index
    const index = args.length - 1

    // normalize the stdout of it
    args[index] = normalizeStdout(args[index])

    return snapshot.apply(null, args)
  },

  setup (options = {}) {
    let npmI

    npmI = options.npmInstall

    if (npmI) {
      before(function () {
        // npm install needs extra time
        this.timeout(human('2 minutes'))

        return cp.execAsync('npm install', {
          cwd: Fixtures.path('projects/e2e'),
          maxBuffer: 1024 * 1000,
        })
        .then(() => {
          if (_.isArray(npmI)) {
            const copyToE2ENodeModules = (module) => {
              return fs.copyAsync(
                path.resolve('node_modules', module), Fixtures.path(`projects/e2e/node_modules/${module}`)
              )
            }

            return Promise
            .map(npmI, niv.install)
            .then(() => Promise.map(npmI, copyToE2ENodeModules))
          }
          // symlinks mess up fs.copySync
          // and bin files aren't necessary for these tests
        }).then(() => {
          return fs.removeAsync(Fixtures.path('projects/e2e/node_modules/.bin'))
        })
      })

      // now cleanup the node modules after because these add a lot
      // of copy time for the Fixtures scaffolding
      after(() => {
        return fs.removeAsync(Fixtures.path('projects/e2e/node_modules'))
      })
    }

    beforeEach(function () {
      // after installing node modules copying all of the fixtures
      // can take a long time (5-15 secs)
      this.timeout(human('2 minutes'))

      Fixtures.scaffold()

      sinon.stub(process, 'exit')

      return Promise.try(() => {
        let servers

        servers = options.servers

        if (servers) {
          servers = [].concat(servers)

          return Promise.map(servers, startServer)
          .then((servers) => {
            this.servers = servers
          })
        }

        this.servers = null
      }).then(() => {
        let s

        s = options.settings

        if (s) {
          return settings.write(e2ePath, s)
        }
      })
    })

    return afterEach(function () {
      let s

      process.env = _.clone(env)

      this.timeout(human('2 minutes'))

      Fixtures.remove()

      s = this.servers

      if (s) {
        return Promise.map(s, stopServer)
      }
    })
  },

  options (ctx, options = {}) {
    let spec

    _.defaults(options, {
      browser: 'electron',
      project: e2ePath,
      timeout: options.exit === false ? 3000000 : 120000,
      originalTitle: null,
      sanitizeScreenshotDimensions: false,
    })

    ctx.timeout(options.timeout)

    spec = options.spec

    if (spec) {
      // normalize into array and then prefix
      const specs = spec.split(',').map((spec) => {
        if (path.isAbsolute(spec)) {
          return spec
        }

        return path.join(options.project, 'cypress', 'integration', spec)
      })

      // normalize the path to the spec
      options.spec = specs.join(',')
    }

    return options
  },

  args (options = {}) {
    let browser
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

    if (options.headed) {
      args.push('--headed')
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

    browser = (options.browser)

    if (browser) {
      args.push(`--browser=${browser}`)
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

    if (options.exit != null) {
      args.push('--exit', options.exit)
    }

    if (options.inspectBrk) {
      args.push('--inspect-brk')
    }

    if (options.tag) {
      args.push(`--tag=${options.tag}`)
    }

    return args
  },

  start (ctx, options = {}) {
    options = this.options(ctx, options)
    const args = this.args(options)

    return cypress.start(args)
    .then(() => {
      let code

      if ((code = options.expectedExitCode) != null) {
        return expect(process.exit).to.be.calledWith(code)
      }
    })
  },

  exec (ctx, options = {}) {
    options = this.options(ctx, options)
    let args = this.args(options)

    args = ['index.js'].concat(args)

    let stdout = ''
    let stderr = ''

    const exit = function (code) {
      let expected

      if ((expected = options.expectedExitCode) != null) {
        expect(code).to.eq(expected, 'expected exit code')
      }

      // snapshot the stdout!
      if (options.snapshot) {
        // enable callback to modify stdout
        let matches; let ostd; let str

        ostd = options.onStdout

        if (ostd) {
          stdout = ostd(stdout)
        }

        // if we have browser in the stdout make
        // sure its legit
        matches = browserNameVersionRe.exec(stdout)

        if (matches) {
          // eslint-disable-next-line no-unused-vars
          const [str, key, customBrowserPath, browserName, version, headless] = matches

          const { browser } = options

          if (browser && !customBrowserPath) {
            expect(_.capitalize(browser)).to.eq(browserName)
          }

          expect(parseFloat(version)).to.be.a.number

          // if we are in headed mode or in a browser other
          // than electron
          if (options.headed || (browser && (browser !== 'electron'))) {
            expect(headless).not.to.exist
          } else {
            expect(headless).to.include('(headless)')
          }
        }

        str = normalizeStdout(stdout, options)

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
        })
        .value(),
      })

      // pipe these to our current process
      // so we can see them in the terminal
      sp.stdout.pipe(process.stdout)
      sp.stderr.pipe(process.stderr)

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
})
