const snapshot = require('snap-shot-it')

import type { SpawnOptions, ChildProcess } from 'child_process'
import stream from 'stream'
import { expect } from './spec_helper'
import { dockerSpawner } from './docker'
import Express from 'express'
import Fixtures from './fixtures'
import * as DepInstaller from './dep-installer'
import {
  DEFAULT_BROWSERS,
  replaceStackTraceLines,
  pathUpToProjectName,
  normalizeStdout,
  browserNameVersionRe,
} from './normalizeStdout'

const isCi = require('is-ci')

require('mocha-banner').register()
const chalk = require('chalk').default
const _ = require('lodash')
let cp = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const http = require('http')
const human = require('human-interval')
const morgan = require('morgan')
const Bluebird = require('bluebird')
const debug = require('debug')('cypress:system-tests')
const httpsProxy = require('@packages/https-proxy')

const { allowDestroy } = require(`@packages/server/lib/util/server_destroy`)
const settings = require(`@packages/server/lib/util/settings`)

// mutates mocha test runner - needed for `test.titlePath`
// TODO: fix this - this mutates cwd and is strange in general
require(`@packages/server/lib/project-base`)

type CypressConfig = { [key: string]: any }

export type BrowserName = 'electron' | 'firefox' | 'chrome' | 'webkit'
| '!electron' | '!chrome' | '!firefox' | '!webkit'

type ExecResult = {
  code: number
  stdout: string
  stderr: string
}

type ExecFn = (options?: ExecOptions) => Promise<ExecResult>

export type ItOptions = ExecOptions & {
  /**
   * If a function is supplied, it will be executed instead of running the `systemTests.exec` function immediately.
   */
  onRun?: (
    this: Mocha.Context,
    execFn: ExecFn,
    browser: BrowserName
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
   * If set, `docker exec` will be used to run this test. Requires Docker.
   */
  dockerImage?: string
  /*
   * If set, test using the built Cypress CLI and binary. Expects a built CLI in `/cli/build` and packed binary in `/cypress.zip`.
   */
  withBinary?: boolean
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
   * If set, use a non-default spec dir.
   */
  specDir?: string
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
   * Pass a function to receive the spawned process as an argument.
   */
  onSpawn?: (sp: SpawnerResult) => void
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
   * Run Cypress with a Record Key.
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

export type Spawner = (cmd, args, env, options: ExecOptions) => SpawnerResult | Promise<SpawnerResult>

export type SpawnerResult = {
  stdout: stream.Readable
  stderr: stream.Readable
  on(event: 'error', cb: (err: Error) => void): void
  on(event: 'exit', cb: (exitCode: number) => void): void
  kill: ChildProcess['kill']
  pid: number
}

const cpSpawner: Spawner = (cmd, args, env, options) => {
  if (options.withBinary) {
    throw new Error('withBinary is not supported without the use of dockerImage')
  }

  return cp.spawn(cmd, args, {
    env,
    ...options.spawnOpts,
  })
}

const serverPath = path.dirname(require.resolve('@packages/server'))

cp = Bluebird.promisifyAll(cp)

const processEnvCache = _.clone(process.env)

Bluebird.config({
  longStackTraces: true,
})

// extract the 'Difference' section from a snap-shot-it error message
const diffRe = /Difference\n-{10}\n([\s\S]*)\n-{19}\nSaved snapshot text/m
const expectedAddedVideoSnapshotLines = [
  'Warning: We failed capturing this video.',
  'This error will not affect or change the exit code.',
  'TimeoutError: operation timed out',
  '[stack trace lines]',
]
const expectedDeletedVideoSnapshotLines = [
  '(Video)',
  '-  Started compressing: Compressing to 32 CRF',
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
    if (line.includes('Finished compressing:')) break

    if (line.charAt(0) === '+') added.push(line.slice(1).trim())

    if (line.charAt(0) === '-') deleted.push(line.slice(1).trim())
  }

  _.pull(added, sometimesAddedVideoSnapshotLine, sometimesAddedSpacingLine)
  _.pull(deleted, sometimesDeletedVideoSnapshotLine, sometimesAddedSpacingLine)

  return _.isEqual(added, expectedAddedVideoSnapshotLines) && (deleted.length === 0 || _.isEqual(deleted, expectedDeletedVideoSnapshotLines))
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

const ensurePort = function (port) {
  if (port === 5566) {
    throw new Error('Specified port cannot be on 5566 because it conflicts with --inspect-brk=5566')
  }
}

const startServer = function (obj) {
  const { onServer, port, https } = obj

  ensurePort(port)

  const app = Express()

  const srv = https ? httpsProxy.httpsServer(app) : new http.Server(app)

  allowDestroy(srv)

  app.use(morgan('dev'))

  if (obj.cors) {
    app.use(require('cors')())
  }

  if (obj.static) {
    app.use(Express.static(path.join(__dirname, '../projects/e2e'), {}) as Express.RequestHandler)
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

const copy = function (projectPath: string) {
  const ca = process.env.CIRCLE_ARTIFACTS

  debug('Should copy Circle Artifacts?', Boolean(ca))

  if (ca) {
    const videosFolder = path.join(projectPath, 'cypress/videos')
    const screenshotsFolder = path.join(projectPath, 'cypress/screenshots')

    debug('Copying Circle Artifacts', ca, videosFolder, screenshotsFolder)

    const copy = (src, dest) => {
      return fs.copyAsync(src, dest, { overwrite: true }).catch({ code: 'ENOENT' }, () => { })
    }

    // copy each of the screenshots and videos
    // to artifacts using each basename of the folders
    return Promise.all([
      copy(screenshotsFolder, path.join(ca, path.basename(screenshotsFolder))),
      copy(videosFolder, path.join(ca, path.basename(videosFolder))),
    ])
  }
}

const getMochaItFn = function (title, only, skip, browser, specifiedBrowser) {
  // if we've been told to skip this test
  // or if we specified a particular browser and this
  // doesn't match the one we're currently trying to run...
  if (skip || (specifiedBrowser && (specifiedBrowser !== browser))) {
    // then skip this test
    return it.skip
  }

  if (only) {
    if (isCi) {
      // fixes the problem where systemTests can accidentally by skipped using systemTests.it.only(...)
      // https://github.com/cypress-io/cypress/pull/20276
      throw new Error(`the system test: "${chalk.yellow(title)}" has been set to run with an it.only() which is not allowed in CI environments.\n\nPlease remove the it.only()`)
    }

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
    const mochaItFn = getMochaItFn(title, options.only, options.skip, browser, specifiedBrowser)

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

      // pass Mocha's this context to onRun
      return options.onRun.call(this, execFn, browser, ctx)
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
    // @ts-ignore
    global.CACHED_CWD_FOR_SNAP_SHOT_IT = path.join(__dirname, '..')

    return snapshot.apply(null, args)
  },

  setup (options: SetupOptions = {}) {
    beforeEach(async function () {
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
      process.env = _.clone(processEnvCache)

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

        const specDir = options.specDir
        || (options.testingType === 'component' ? '' : 'cypress/e2e')

        return path.join(projectPath, specDir, spec)
      })

      // normalize the path to the spec
      options.spec = specs.join(',')
    }

    return options
  },

  args (options: ExecOptions) {
    debug('converting options to args %o', { options })

    const projectPath = Fixtures.projectPath(options.project)
    const args = options.withBinary ? [
      `run`,
      `--project=${projectPath}`,
      options.testingType === 'component' ? '--component' : '--e2e',
    ] : [
      require.resolve('@packages/server'),
      // hides a user warning to go through NPM module
      `--cwd=${serverPath}`,
      `--run-project=${projectPath}`,
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

    // Force the default to have compression off
    if (!options.config) {
      options.config = {
        videoCompression: false,
      }
    } else if (!options.config.videoCompression) {
      options.config.videoCompression = false
    }

    debug('processed options %o', options)
    const args = options.args || this.args(options)

    const specifiedBrowser = process.env.BROWSER
    const projectPath = Fixtures.projectPath(options.project)

    if (specifiedBrowser && (![].concat(options.browser).includes(specifiedBrowser))) {
      ctx.skip()
    }

    if (!options.skipScaffold) {
      // symlinks won't work via docker
      options.dockerImage || await DepInstaller.scaffoldCommonNodeModules()
      await Fixtures.scaffoldProject(options.project)
      await DepInstaller.scaffoldProjectNodeModules({ project: options.project })
    }

    if (process.env.NO_EXIT) {
      Fixtures.scaffoldWatch()
    }

    if (ctx.settings) {
      await settings.writeForTesting(projectPath, ctx.settings)
    }

    let stdout = ''
    let stderr = ''

    const exit = function (code) {
      const { expectedExitCode } = options

      maybeVerifyExitCode(expectedExitCode, () => {
        if (expectedExitCode === 0) {
          expect(code).to.eq(expectedExitCode, `Process errored: Exit code ${code}`)
        } else {
          expect(code).to.to.eq(expectedExitCode, `expected exit code ${expectedExitCode} but got ${code}`)
        }
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
            expect(String(browser).toLowerCase()).to.eq(browserName.toLowerCase())
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

          console.log('(system tests warning) Firefox failed to process the video, but this is being ignored due to known issues with video capturing in Firefox.')
        }
      }

      return {
        code,
        stdout,
        stderr,
      }
    }

    debug('spawning Cypress %o', { args })

    const cmd = options.command || (options.withBinary ? 'cypress' : 'node')

    const env = _.chain(process.env)
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

      // opt in to WebKit experimental support if we are running w WebKit
      ...(specifiedBrowser === 'webkit' ? {
        CYPRESS_experimentalWebKitSupport: 'true',
        // prevent snapshots from failing due to "Experiments:  experimentalWebKitSupport=true" difference
        CYPRESS_INTERNAL_SKIP_EXPERIMENT_LOGS: '1',
      } : {}),
    })
    .extend(options.processEnv)
    .value()

    const spawnerFn: Spawner = options.dockerImage ? dockerSpawner : cpSpawner
    const sp: SpawnerResult = await spawnerFn(cmd, args, env, options)

    options.onSpawn && options.onSpawn(sp)

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

    await copy(projectPath)

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
    .replace(/Project is running at http:\/\/localhost:\d+/g, 'Project is running at http://localhost:xxxx')
    .replace(/webpack.*compiled with.*in \d+ ms/g, 'webpack x.x.x compiled with x errors in xxx ms')
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
