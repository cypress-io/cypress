/* eslint-disable no-console */
/*global globalThis*/
require('../spec_helper')
const _ = require('lodash')
const path = require('path')
const EE = require('events')
const http = require('http')
const Promise = require('bluebird')
const electron = require('electron')
const commitInfo = require('@cypress/commit-info')
const Fixtures = require('@tooling/system-tests')
const { normalizeStdout } = require('@tooling/system-tests/lib/normalizeStdout')
const snapshot = require('snap-shot-it')
const stripAnsi = require('strip-ansi')
const pkg = require('@packages/root')
const detect = require('@packages/launcher/lib/detect')
const launch = require('@packages/launcher/lib/browsers')
const extension = require('@packages/extension')
const { validation: v } = require('@packages/config')

const argsUtil = require(`../../lib/util/args`)
const { fs } = require(`../../lib/util/fs`)
const ciProvider = require(`../../lib/util/ci_provider`)
const settings = require(`../../lib/util/settings`)
const Windows = require(`../../lib/gui/windows`)
const interactiveMode = require(`../../lib/modes/interactive`)
const api = require(`../../lib/cloud/api`)
const cwd = require(`../../lib/cwd`)
const user = require(`../../lib/cloud/user`)
const cache = require(`../../lib/cache`)
const errors = require(`../../lib/errors`)
const cypress = require(`../../lib/cypress`)
const ProjectBase = require(`../../lib/project-base`).ProjectBase
const { ServerE2E } = require(`../../lib/server-e2e`)
const Reporter = require(`../../lib/reporter`)
const browsers = require(`../../lib/browsers`)
const videoCapture = require(`../../lib/video_capture`)
const browserUtils = require(`../../lib/browsers/utils`)
const chromeBrowser = require(`../../lib/browsers/chrome`)
const { openProject } = require(`../../lib/open_project`)
const env = require(`../../lib/util/env`)
const system = require(`../../lib/util/system`)
const appData = require(`../../lib/util/app_data`)
const electronApp = require('../../lib/util/electron-app')
const savedState = require(`../../lib/saved_state`)
const { getCtx, clearCtx, setCtx, makeDataContext } = require(`../../lib/makeDataContext`)
const { BrowserCriClient } = require(`../../lib/browsers/browser-cri-client`)
const { cloudRecommendationMessage } = require('../../lib/util/print-run')

const TYPICAL_BROWSERS = [
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chrome',
    version: '60.0.3112.101',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    majorVersion: '60',
  }, {
    name: 'chromium',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chromium',
    version: '49.0.2609.0',
    path: '/Users/bmann/Downloads/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    majorVersion: '49',
  }, {
    name: 'chrome',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Canary',
    version: '62.0.3197.0',
    path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    majorVersion: '62',
  },
]

const ELECTRON_BROWSER = {
  name: 'electron',
  family: 'chromium',
  displayName: 'Electron',
  path: '',
  version: '99.101.1234',
  majorVersion: 99,
}

const previousCwd = process.cwd()

const snapshotConsoleLogs = function (name) {
  const args = _
  .chain(console.log.args)
  .map((innerArgs) => {
    return innerArgs.join(' ')
  }).join('\n')
  .value()

  // our cwd() is currently the project
  // so must switch back to original
  process.chdir(previousCwd)

  const snap = normalizeStdout(stripAnsi(args))

  return snapshot(name, snap)
}

function mockEE () {
  const ee = new EE()

  ee.kill = () => {
    // ughh, would be nice to test logic inside the launcher
    // that cleans up after the browser exit
    // like calling client.close() if available to let the
    // browser free any resources
    return ee.emit('exit')
  }

  ee.destroy = () => {
    return ee.emit('closed')
  }

  ee.isDestroyed = () => {
    return false
  }

  ee.loadURL = () => {}
  ee.focusOnWebView = () => {}
  ee.webContents = {
    getOSProcessId: sinon.stub(),
    setUserAgent: sinon.stub(),
    session: {
      clearCache: sinon.stub().resolves(),
      setProxy: sinon.stub().resolves(),
      setUserAgent: sinon.stub(),
      on: sinon.stub(),
      removeListener: sinon.stub(),
      webRequest: {
        onBeforeSendHeaders () {},
      },
    },
  }

  ee.maximize = sinon.stub
  ee.setSize = sinon.stub

  return ee
}

let ctx

describe('lib/cypress', () => {
  require('mocha-banner').register()

  beforeEach(async function () {
    ctx = getCtx()
    process.chdir(previousCwd)
    this.timeout(8000)

    await cache.remove()

    Fixtures.scaffold()
    this.todosPath = Fixtures.projectPath('todos')
    this.pristinePath = Fixtures.projectPath('pristine')
    this.pristineWithConfigPath = Fixtures.projectPath('pristine-with-e2e-testing')
    this.noScaffolding = Fixtures.projectPath('no-scaffolding')
    this.recordPath = Fixtures.projectPath('record')
    this.pluginConfig = Fixtures.projectPath('plugin-config')
    this.pluginBrowser = Fixtures.projectPath('plugin-browser')
    this.idsPath = Fixtures.projectPath('ids')

    // force cypress to call directly into main without
    // spawning a separate process
    sinon.stub(videoCapture, 'start').resolves({})
    sinon.stub(electronApp, 'isRunning').returns(true)
    sinon.stub(extension, 'setHostAndPath').resolves()
    sinon.stub(detect, 'detect').resolves(TYPICAL_BROWSERS)
    sinon.stub(process, 'exit')
    sinon.stub(ServerE2E.prototype, 'reset')
    sinon.stub(errors, 'warning')
    .callThrough()
    .withArgs('INVOKED_BINARY_OUTSIDE_NPM_MODULE')
    .returns(null)

    sinon.spy(errors, 'log')
    sinon.spy(errors, 'logException')
    sinon.spy(console, 'log')

    // to make sure our Electron browser mock object passes validation during tests
    sinon.stub(process, 'versions').value({
      chrome: ELECTRON_BROWSER.version,
      electron: '123.45.6789',
    })

    this.expectExitWith = (code) => {
      expect(process.exit).to.be.calledWith(code)
    }

    // returns error object
    this.expectExitWithErr = (type, msg1, msg2) => {
      expect(errors.log, 'error was logged').to.be.calledWithMatch({ type })
      expect(process.exit, 'process.exit was called').to.be.calledWith(1)

      const err = errors.log.getCall(0).args[0]

      if (msg1) {
        expect(stripAnsi(err.message), 'error text').to.include(msg1)
      }

      if (msg2) {
        expect(stripAnsi(err.message), 'second error text').to.include(msg2)
      }

      return err
    }
  })

  afterEach(async () => {
    try {
      // make sure every project
      // we spawn is closed down
      await openProject.close()
    } catch (e) {
      // ...
    }

    Fixtures.remove()
    delete globalThis['CY_TEST_MOCK']
  })

  context('test browsers', () => {
    // sanity checks to make sure the browser objects we pass during tests
    // all pass the internal validation function
    it('has valid browsers', () => {
      expect(v.isValidBrowserList('browsers', TYPICAL_BROWSERS)).to.be.true
    })

    it('has valid electron browser', () => {
      expect(v.isValidBrowserList('browsers', [ELECTRON_BROWSER])).to.be.true
    })

    it('allows browser major to be a number', () => {
      const browser = {
        name: 'Edge Beta',
        family: 'chromium',
        displayName: 'Edge Beta',
        version: '80.0.328.2',
        path: '/some/path',
        majorVersion: 80,
      }

      expect(v.isValidBrowserList('browsers', [browser])).to.be.true
    })

    it('validates returned list', () => {
      return browserUtils.getBrowsers().then((list) => {
        expect(v.isValidBrowserList('browsers', list)).to.be.true
      })
    })
  })

  context('error handling', function () {
    it('exits if config cannot be parsed', function () {
      return cypress.start(['--config', 'xyz'])
      .then(() => {
        const err = this.expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        snapshot('could not parse config error', stripAnsi(err.message))
      })
    })

    it('exits if env cannot be parsed', function () {
      return cypress.start(['--env', 'a123'])
      .then(() => {
        const err = this.expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        snapshot('could not parse env error', stripAnsi(err.message))
      })
    })

    it('exits if reporter options cannot be parsed', function () {
      return cypress.start(['--reporterOptions', 'nonono'])
      .then(() => {
        const err = this.expectExitWithErr('COULD_NOT_PARSE_ARGUMENTS')

        snapshot('could not parse reporter options error', stripAnsi(err.message))
      })
    })
  })

  context('invalid config', function () {
    beforeEach(async function () {
      this.win = {
        on: sinon.stub(),
        webContents: {
          on: sinon.stub(),
        },
      }

      await clearCtx()
      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      sinon.stub(Windows, 'open').resolves(this.win)
    })

    it('shows warning if config is not valid', function () {
      return cypress.start(['--config=test=false', '--cwd=/foo/bar'])
      .then(() => {
        expect(errors.warning).to.be.calledWith('INVALID_CONFIG_OPTION')
        expect(console.log).to.be.calledWithMatch('The following configuration option is invalid:')
        expect(console.log).to.be.calledWithMatch(`test`)
        expect(console.log).to.be.calledWithMatch('https://on.cypress.io/configuration')
      })
    })

    it('shows warning when multiple config are not valid', function () {
      return cypress.start(['--config=test=false,foo=bar', '--cwd=/foo/bar'])
      .then(() => {
        expect(errors.warning).to.be.calledWith('INVALID_CONFIG_OPTION')
        expect(console.log).to.be.calledWithMatch('The following configuration options are invalid:')
        expect(console.log).to.be.calledWithMatch('test')
        expect(console.log).to.be.calledWithMatch('foo')
        expect(console.log).to.be.calledWithMatch('https://on.cypress.io/configuration')

        snapshotConsoleLogs('INVALID_CONFIG_OPTION')
      })
    })

    it('does not show warning if config is valid', function () {
      return cypress.start(['--config=trashAssetsBeforeRuns=false'])
      .then(() => {
        expect(errors.warning).to.not.be.calledWith('INVALID_CONFIG_OPTION')
      })
    })
  })

  context('--run-project', () => {
    beforeEach(async () => {
      await clearCtx()

      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      globalThis.CY_TEST_MOCK = {
        waitForSocketConnection: true,
        listenForProjectEnd: { stats: { failures: 0 } },
      }

      sinon.stub(browsers, 'open')
      sinon.stub(browsers, 'connectToNewSpec')
      sinon.stub(commitInfo, 'getRemoteOrigin').resolves('remoteOrigin')
    })

    describe('cloud recommendation message', () => {
      it('gets logged when in CI and there is a failure', function () {
        const relativePath = path.relative(cwd(), this.todosPath)

        sinon.stub(ciProvider, 'getIsCi').returns(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${this.todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(console.log).to.be.calledWith(cloudRecommendationMessage)

          snapshotConsoleLogs('CLOUD_RECOMMENDATION_MESSAGE')
        })
      })

      it('does not get logged if CYPRESS_COMMERCIAL_RECOMMENDATIONS is set to 0', function () {
        const relativePath = path.relative(cwd(), this.todosPath)

        sinon.stub(ciProvider, 'getIsCi').returns(true)
        process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS = '0'
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${this.todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(console.log).not.to.be.calledWith(cloudRecommendationMessage)
        })
      })

      it('does not get logged if all tests pass', function () {
        const relativePath = path.relative(cwd(), this.todosPath)

        sinon.stub(ciProvider, 'getIsCi').returns(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 0 } }

        return cypress.start([`--run-project=${this.todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(console.log).not.to.be.calledWith(cloudRecommendationMessage)
        })
      })

      it('does not get logged if not running in CI', function () {
        const relativePath = path.relative(cwd(), this.todosPath)

        sinon.stub(ciProvider, 'getIsCi').returns(undefined)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([`--run-project=${this.todosPath}`, `--spec=${relativePath}/tests/test1.js`]).then(() => {
          expect(console.log).not.to.be.calledWith(cloudRecommendationMessage)
        })
      })
    })

    it('runs project headlessly and exits with exit code 0', function () {
      return cypress.start([`--run-project=${this.todosPath}`])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER)
        this.expectExitWith(0)
      })
    })

    it('sets --headed false if --headless', function () {
      sinon.spy(cypress, 'startInMode')

      return cypress.start([`--run-project=${this.todosPath}`, '--headless'])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER)
        this.expectExitWith(0)

        // check how --headless option sets --headed
        expect(cypress.startInMode).to.be.calledOnce
        expect(cypress.startInMode).to.be.calledWith('run')
        const startInModeOptions = cypress.startInMode.firstCall.args[1]

        expect(startInModeOptions).to.include({
          headless: true,
          headed: false,
        })
      })
    })

    it('throws an error if both --headed and --headless are true', function () {
      // error is thrown synchronously
      expect(() => cypress.start([`--run-project=${this.todosPath}`, '--headless', '--headed']))
      .to.throw('Impossible options: both headless and headed are true')
    })

    describe('strips --', () => {
      beforeEach(() => {
        sinon.spy(argsUtil, 'toObject')
      })

      it('strips leading', function () {
        return cypress.start(['--', `--run-project=${this.todosPath}`])
        .then(() => {
          expect(argsUtil.toObject).to.have.been.calledWith([`--run-project=${this.todosPath}`])
          expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER)
          this.expectExitWith(0)
        })
      })

      it('strips in the middle', function () {
        return cypress.start([`--run-project=${this.todosPath}`, '--', '--browser=electron'])
        .then(() => {
          expect(argsUtil.toObject).to.have.been.calledWith([`--run-project=${this.todosPath}`, '--browser=electron'])
          expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER)
          this.expectExitWith(0)
        })
      })
    })

    it('runs project headlessly and exits with exit code 10', function () {
      globalThis.CY_TEST_MOCK.runSpecs = { totalFailed: 10 }

      return cypress.start([`--run-project=${this.todosPath}`])
      .then(() => {
        this.expectExitWith(10)
      })
    })

    it('does not add project to the global cache', function () {
      return cache.getProjectRoots()
      .then((projects) => {
        // no projects in the cache
        expect(projects.length).to.eq(0)

        return cypress.start([`--run-project=${this.todosPath}`])
      }).then(() => {
        return cache.getProjectRoots()
      }).then((projects) => {
        // still not projects
        expect(projects.length).to.eq(0)
      })
    })

    it('runs project by relative spec and exits with status 0', function () {
      const relativePath = path.relative(cwd(), this.todosPath)

      return cypress.start([
        `--run-project=${this.todosPath}`,
        `--spec=${relativePath}/tests/test2.coffee`,
      ])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {
          url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.coffee',
        })

        this.expectExitWith(0)
      })
    })

    it('runs project by specific spec with default configuration', function () {
      return cypress.start([`--run-project=${this.idsPath}`, `--spec=${this.idsPath}/**/*qux*`, '--config', 'port=2020'])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, { url: 'http://localhost:2020/__/#/specs/runner?file=cypress/e2e/qux.cy.js' })
        expect(browsers.open).to.be.calledOnce
        this.expectExitWith(0)
      })
    })

    it('runs project by specific absolute spec and exits with status 0', function () {
      return cypress.start([`--run-project=${this.todosPath}`, `--spec=${this.todosPath}/tests/test2.coffee`])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.coffee' })
        this.expectExitWith(0)
      })
    })

    it('runs project by limiting spec files via config.e2e.specPattern string glob pattern', function () {
      return cypress.start([`--run-project=${this.todosPath}`, `--config={"e2e":{"specPattern":"${this.todosPath}/tests/test2.coffee"}}`])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.coffee' })
        this.expectExitWith(0)
      })
    })

    it('runs project by limiting spec files via config.e2e.specPattern as a JSON array of string glob patterns', function () {
      return cypress.start([`--run-project=${this.todosPath}`, '--config={"e2e":{"specPattern":["**/test2.coffee","**/test1.js"]}}'])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.coffee' })
      }).then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test1.js' })
        this.expectExitWith(0)
      })
    })

    it('does not scaffold when headless and exits with error when no existing project', function () {
      const ensureDoesNotExist = function (inspection, index) {
        if (!inspection.isRejected()) {
          throw new Error(`File or folder was scaffolded at index: ${index}`)
        }

        expect(inspection.reason()).to.have.property('code', 'ENOENT')
      }

      return Promise.all([
        fs.statAsync(path.join(this.pristinePath, 'cypress')).reflect(),
        fs.statAsync(path.join(this.pristinePath, 'cypress.config.js')).reflect(),
      ])
      .each(ensureDoesNotExist).then(() => {
        return cypress.start([`--run-project=${this.pristinePath}`])
      }).then(() => {
        return Promise.all([
          fs.statAsync(path.join(this.pristinePath, 'cypress')).reflect(),
          fs.statAsync(path.join(this.pristinePath, 'cypress.config.js')).reflect(),
        ])
      })
    })

    it('runs project headed and displays gui', function () {
      return cypress.start([`--run-project=${this.todosPath}`, '--headed'])
      .then(() => {
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {
          proxyServer: 'http://localhost:8888',
          browser: {
            isHeadless: false,
          },
        })

        this.expectExitWith(0)
      })
    })

    it('turns on reporting', function () {
      sinon.spy(Reporter, 'create')

      return cypress.start([`--run-project=${this.todosPath}`])
      .then(() => {
        expect(Reporter.create).to.be.calledWith('spec')
        this.expectExitWith(0)
      })
    })

    it('can change the reporter to nyan', function () {
      sinon.spy(Reporter, 'create')

      return cypress.start([`--run-project=${this.todosPath}`, '--reporter=nyan'])
      .then(() => {
        expect(Reporter.create).to.be.calledWith('nyan')
        this.expectExitWith(0)
      })
    })

    it('can change the reporter with cypress.config.js', async function () {
      sinon.spy(Reporter, 'create')

      return cypress.start([`--run-project=${this.idsPath}`, `--config-file=${this.idsPath}/cypress.dot-reporter.config.js`])
      .then(() => {
        expect(Reporter.create).to.be.calledWith('dot')
        this.expectExitWith(0)
      })
    })

    it('runs tests even when user isn\'t logged in', function () {
      return user.set({})
      .then(() => {
        return cypress.start([`--run-project=${this.todosPath}`])
      }).then(() => {
        this.expectExitWith(0)
      })
    })

    it('logs warning when projectId and key but no record option', function () {
      return cypress.start([`--run-project=${this.todosPath}`, '--key=asdf'])
      .then(() => {
        expect(errors.warning).to.be.calledWith('PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')
        expect(console.log).to.be.calledWithMatch('You also provided your Record Key, but you did not pass the')
        expect(console.log).to.be.calledWithMatch('cypress run --record')
        expect(console.log).to.be.calledWithMatch('https://on.cypress.io/recording-project-runs')
      })
    })

    it('logs warning when removing old browser profiles fails', function () {
      const err = new Error('foo')

      sinon.stub(browsers, 'removeOldProfiles').rejects(err)

      return cypress.start([`--run-project=${this.todosPath}`])
      .then(() => {
        expect(errors.warning).to.be.calledWith('CANNOT_REMOVE_OLD_BROWSER_PROFILES', err)
        expect(console.log).to.be.calledWithMatch('Warning: We failed to remove old browser profiles from previous runs.')
        expect(console.log).to.be.calledWithMatch(err.message)
      })
    })

    it('does not log warning when no projectId', function () {
      return cypress.start([`--run-project=${this.pristinePath}`, '--key=asdf'])
      .then(() => {
        expect(errors.warning).not.to.be.calledWith('PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')
        expect(console.log).not.to.be.calledWithMatch('cypress run --key <record_key>')
      })
    })

    it('does not log warning when projectId but --record false', function () {
      return cypress.start([`--run-project=${this.todosPath}`, '--key=asdf', '--record=false'])
      .then(() => {
        expect(errors.warning).not.to.be.calledWith('PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')
        expect(console.log).not.to.be.calledWithMatch('cypress run --key <record_key>')
      })
    })

    it(`logs error when supportFile doesn't exist`, function () {
      return settings.writeForTesting(this.idsPath, { e2e: { supportFile: '/does/not/exist' } })
      .then(() => {
        return cypress.start([`--run-project=${this.idsPath}`])
      })
      .then(() => {
        this.expectExitWithErr('SUPPORT_FILE_NOT_FOUND', `Your supportFile is missing or invalid: /does/not/exist`)
      })
    })

    it('logs error when browser cannot be found', function () {
      browsers.open.restore()

      return cypress.start([`--run-project=${this.idsPath}`, '--browser=foo'])
      .then(() => {
        this.expectExitWithErr('BROWSER_NOT_FOUND_BY_NAME')

        // get all the error args
        const argsSet = errors.log.args

        const found1 = _.find(argsSet, (args) => {
          return _.find(args, (arg) => {
            return arg.message && stripAnsi(arg.message).includes(
              `Browser: foo was not found on your system or is not supported by Cypress.`,
            )
          })
        })

        expect(found1, `foo should not be found`).to.be.ok

        const found2 = _.find(argsSet, (args) => {
          return _.find(args, (arg) => {
            return arg.message && stripAnsi(arg.message).includes(
              'Cypress supports the following browsers:',
            )
          })
        })

        expect(found2, 'supported browsers should be listed').to.be.ok

        const found3 = _.find(argsSet, (args) => {
          return _.find(args, (arg) => {
            return arg.message && stripAnsi(arg.message).includes(
              'Available browsers found on your system are:\n - chrome\n - chromium\n - chrome:canary\n - electron',
            )
          })
        })

        expect(found3, 'browser names should be listed').to.be.ok
      })
    })

    describe('no specs found', function () {
      it('logs error and exits when spec file was specified and does not exist', function () {
        const cwd = process.cwd()

        return cypress.start([
          `--cwd=${cwd}`,
          `--run-project=${this.todosPath}`,
          '--spec=path/to/spec',
        ])
        .then(() => {
          // includes the search spec
          this.expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern:')
          // includes the project path
          this.expectExitWithErr('NO_SPECS_FOUND', path.join(cwd, 'path/to/spec'))
        })
      })

      it('logs error and exits when spec file was specified and does not exist using ../ pattern', function () {
        const cwd = process.cwd()

        return cypress.start([
          `--cwd=${cwd}`,
          `--run-project=${this.todosPath}`,
          '--spec=../path/to/spec',
        ])
        .then(() => {
          // includes the search spec
          this.expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern:')
          // includes the project path
          this.expectExitWithErr('NO_SPECS_FOUND', path.join(cwd, '../path/to/spec'))
        })
      })

      it('logs error and exits when spec file was specified with glob and does not exist using ../ pattern', function () {
        const cwd = process.cwd()

        return cypress.start([
          `--cwd=${cwd}`,
          `--run-project=${this.todosPath}`,
          '--spec=../path/to/**/*',
        ])
        .then(() => {
          // includes the search spec
          this.expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern:')
          // includes the project path
          this.expectExitWithErr('NO_SPECS_FOUND', path.join(cwd, '../path/to/**/*'))
        })
      })

      it('logs error and exits when spec absolute file was specified and does not exist', function () {
        return cypress.start([
          `--run-project=${this.todosPath}`,
          `--spec=/path/to/spec`,
        ])
        .then(() => {
          // includes folder name + path to the spec
          this.expectExitWithErr('NO_SPECS_FOUND', `/path/to/spec`)
          expect(errors.log).not.to.be.calledWithMatch(this.todospath)
        })
      })

      it('logs error and exits when no specs were found at all', function () {
        return cypress.start([
          `--run-project=${this.todosPath}`,
          '--spec=/this/does/not/exist/**/*',
        ])
        .then(() => {
          this.expectExitWithErr('NO_SPECS_FOUND', 'We searched for specs matching this glob pattern')
          this.expectExitWithErr('NO_SPECS_FOUND', 'this/does/not/exist/**/*')
        })
      })
    })

    it('logs error and exits when project has cypress.config.js syntax error', function () {
      return fs.writeFileAsync(`${this.todosPath}/cypress.config.js`, `module.exports = {`)
      .then(() => {
        return cypress.start([`--run-project=${this.todosPath}`])
      }).then(() => {
        this.expectExitWithErr('CONFIG_FILE_REQUIRE_ERROR', this.todosPath)
      })
    })

    it('logs error and exits when project has cypress.env.json syntax error', function () {
      return fs.writeFileAsync(`${this.todosPath}/cypress.env.json`, '{\'foo\': \'bar}')
      .then(() => {
        return cypress.start([`--run-project=${this.todosPath}`])
      }).then(() => {
        this.expectExitWithErr('ERROR_READING_FILE', this.todosPath)
      })
    })

    it('logs error and exits when project has invalid cypress.config.js values', function () {
      return settings.writeForTesting(this.todosPath, { baseUrl: 'localhost:9999' })
      .then(() => {
        return cypress.start([`--run-project=${this.todosPath}`])
      }).then(() => {
        this.expectExitWithErr('CONFIG_VALIDATION_ERROR', 'cypress.config.js')
      })
    })

    it('logs error and exits when project has invalid config values from the CLI', function () {
      return cypress.start([
        `--run-project=${this.todosPath}`,
        '--config=baseUrl=localhost:9999',
      ])
      .then(() => {
        this.expectExitWithErr('CONFIG_VALIDATION_ERROR', 'localhost:9999')
        this.expectExitWithErr('CONFIG_VALIDATION_ERROR', 'An invalid configuration value was set.')
      })
    })

    it('logs error and exits when project has invalid config values from env vars', function () {
      process.env.CYPRESS_BASE_URL = 'localhost:9999'

      return cypress.start([`--run-project=${this.todosPath}`])
      .then(() => {
        this.expectExitWithErr('CONFIG_VALIDATION_ERROR', 'localhost:9999')
        this.expectExitWithErr('CONFIG_VALIDATION_ERROR', 'An invalid configuration value was set.')
      })
    })

    const renamedConfigs = [
      {
        old: 'blacklistHosts',
        new: 'blockHosts',
      },
    ]

    renamedConfigs.forEach(function (config) {
      it(`logs error and exits when using an old configuration option: ${config.old}`, function () {
        return cypress.start([
          `--run-project=${this.todosPath}`,
          `--config=${config.old}=''`,
        ])
        .then(() => {
          this.expectExitWithErr('RENAMED_CONFIG_OPTION', config.old)
          this.expectExitWithErr('RENAMED_CONFIG_OPTION', config.new)
        })
      })
    })

    // TODO: make sure we have integration tests around this
    // for headed projects!
    // also make sure we test the rest of the integration functionality
    // for headed errors! <-- not unit tests, but integration tests!
    it('logs error and exits when project folder has read permissions only and cannot write cypress.config.js', function () {
      // test disabled if running as root (such as inside docker) - root can write all things at all times
      if (process.geteuid() === 0) {
        return
      }

      const permissionsPath = path.resolve('./permissions')
      const cypressConfig = path.join(permissionsPath, 'cypress.config.js')

      return fs.mkdirAsync(permissionsPath)
      .then(() => {
        return fs.outputFileAsync(cypressConfig, 'module.exports = { e2e: { supportFile: false } }')
      }).then(() => {
        // read only
        return fs.chmodAsync(permissionsPath, '555')
      }).then(() => {
        return cypress.start([`--run-project=${permissionsPath}`])
      }).then(() => {
        return fs.chmodAsync(permissionsPath, '777')
      }).then(() => {
        this.expectExitWithErr('ERROR_WRITING_FILE', permissionsPath)
      }).finally(() => {
        return fs.rmdir(permissionsPath, { recursive: true })
      })
    })

    it('logs error and exits when reporter does not exist', function () {
      return cypress.start([`--run-project=${this.todosPath}`, '--reporter', 'foobarbaz'])
      .then(() => {
        this.expectExitWithErr('INVALID_REPORTER_NAME', 'foobarbaz')
      })
    })

    describe('state', () => {
      beforeEach(function () {
        return appData.remove()
        .then(() => {
          return savedState.formStatePath(this.todosPath)
        }).then((statePathStart) => {
          this.statePath = appData.projectsPath(statePathStart)
        })
      })

      it('does not save project state', function () {
        return cypress.start([`--run-project=${this.todosPath}`, `--spec=${this.todosPath}/tests/test2.coffee`])
        .then(() => {
          this.expectExitWith(0)

          // this should not save the project's state
          // because its a noop in 'cypress run' mode
          return openProject.getProject().saveState()
        }).then(() => {
          return fs.statAsync(this.statePath)
          .then(() => {
            throw new Error(`saved state should not exist but it did here: ${this.statePath}`)
          }).catch({ code: 'ENOENT' }, () => {})
        })
      })
    })

    describe('morgan', () => {
      it('sets morgan to false', function () {
        return cypress.start([`--run-project=${this.todosPath}`])
        .then(() => {
          expect(openProject.getProject().cfg.morgan).to.be.false
          this.expectExitWith(0)
        })
      })
    })

    describe('config overrides', () => {
      beforeEach(function () {
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
      })

      it('can override default values', function () {
        return cypress.start([`--run-project=${this.todosPath}`, '--config=requestTimeout=1234,videoCompression=false'])
        .then(() => {
          const { cfg } = openProject.getProject()

          expect(cfg.videoCompression).to.be.false
          expect(cfg.requestTimeout).to.eq(1234)

          expect(cfg.resolved.videoCompression).to.deep.eq({
            value: false,
            from: 'cli',
          })

          expect(cfg.resolved.requestTimeout).to.deep.eq({
            value: 1234,
            from: 'cli',
          })

          this.expectExitWith(0)
        })
      })

      it('can override values in plugins', function () {
        return cypress.start([
          `--run-project=${this.pluginConfig}`, '--config=requestTimeout=1234,videoCompression=false',
          '--env=foo=foo,bar=bar',
        ])
        .then(() => {
          const { cfg } = openProject.getProject()

          expect(cfg.videoCompression).to.eq(20)
          expect(cfg.defaultCommandTimeout).to.eq(500)
          expect(cfg.env).to.deep.eq({
            foo: 'bar',
            bar: 'bar',
          })

          expect(cfg.resolved.videoCompression).to.deep.eq({
            value: 20,
            from: 'plugin',
          })

          expect(cfg.resolved.requestTimeout).to.deep.eq({
            value: 1234,
            from: 'cli',
          })

          expect(cfg.resolved.env.foo).to.deep.eq({
            value: 'bar',
            from: 'plugin',
          })

          expect(cfg.resolved.env.bar).to.deep.eq({
            value: 'bar',
            from: 'cli',
          })

          this.expectExitWith(0)
        })
      })
    })

    describe('plugins', () => {
      beforeEach(() => {
        browsers.open.restore()

        const ee = mockEE()

        sinon.stub(launch, 'launch').returns(ee)
        sinon.stub(Windows, 'create').returns(ee)
      })

      context('before:browser:launch', () => {
        it('chrome', function () {
          // during testing, do not try to connect to the remote interface or
          // use the Chrome remote interface client
          const criClient = {
            on: sinon.stub(),
            send: sinon.stub(),
          }
          const browserCriClient = {
            ensureMinimumProtocolVersion: sinon.stub().resolves(),
            attachToTargetUrl: sinon.stub().resolves(criClient),
            close: sinon.stub().resolves(),
          }

          const cdpAutomation = {
            _handlePausedRequests: sinon.stub().resolves(),
            _listenForFrameTreeChanges: sinon.stub().returns(),
          }

          sinon.stub(chromeBrowser, '_writeExtension').resolves()

          sinon.stub(BrowserCriClient, 'create').resolves(browserCriClient)
          // the "returns(resolves)" stub is due to curried method
          // it accepts URL to visit and then waits for actual CRI client reference
          // and only then navigates to that URL
          sinon.stub(chromeBrowser, '_navigateUsingCRI').resolves()
          sinon.stub(chromeBrowser, '_handleDownloads').resolves()
          sinon.stub(chromeBrowser, '_recordVideo').resolves()

          sinon.stub(chromeBrowser, '_setAutomation').returns(cdpAutomation)

          return cypress.start([
            `--run-project=${this.pluginBrowser}`,
            '--browser=chrome',
          ])
          .then(() => {
            const { args } = launch.launch.firstCall

            // when we work with the browsers we set a few extra flags
            const chrome = _.find(TYPICAL_BROWSERS, { name: 'chrome' })
            const launchedChrome = _.defaults({}, chrome, {
              isHeadless: true,
              isHeaded: false,
            })

            expect(args[0], 'found and used Chrome').to.deep.eq(launchedChrome)

            const browserArgs = args[3]

            expect(browserArgs.slice(0, 4), 'first 4 custom launch arguments to Chrome').to.deep.eq([
              'chrome', 'foo', 'bar', 'baz',
            ])

            this.expectExitWith(0)

            expect(chromeBrowser._navigateUsingCRI).to.have.been.calledOnce
            expect(chromeBrowser._setAutomation).to.have.been.calledOnce
            expect(chromeBrowser._recordVideo).to.have.been.calledOnce

            expect(BrowserCriClient.create).to.have.been.calledOnce
            expect(browserCriClient.attachToTargetUrl).to.have.been.calledOnce

            expect(cdpAutomation._handlePausedRequests).to.have.been.calledOnce
            expect(cdpAutomation._listenForFrameTreeChanges).to.have.been.calledOnce
          })
        })

        it('electron', function () {
          // during testing, do not try to connect to the remote interface or
          // use the Chrome remote interface client
          const criClient = {
            on: sinon.stub(),
            send: sinon.stub(),
          }
          const browserCriClient = {
            ensureMinimumProtocolVersion: sinon.stub().resolves(),
            attachToTargetUrl: sinon.stub().resolves(criClient),
            currentlyAttachedTarget: criClient,
            close: sinon.stub().resolves(),
          }

          sinon.stub(BrowserCriClient, 'create').resolves(browserCriClient)

          videoCapture.start.returns()

          return cypress.start([
            `--run-project=${this.pluginBrowser}`,
            '--browser=electron',
          ])
          .then(() => {
            expect(Windows.create).to.be.calledWithMatch(this.pluginBrowser, {
              browser: 'electron',
              foo: 'bar',
              onNewWindow: sinon.match.func,
            })

            expect(BrowserCriClient.create).to.have.been.calledOnce
            expect(browserCriClient.attachToTargetUrl).to.have.been.calledOnce

            this.expectExitWith(0)
          })
        })
      })
    })

    describe('--port', () => {
      beforeEach(() => {
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 0 } }
      })

      it('can change the default port to 5544', function () {
        const listen = sinon.spy(http.Server.prototype, 'listen')
        const open = sinon.spy(ServerE2E.prototype, 'open')

        return cypress.start([`--run-project=${this.todosPath}`, '--port=5544'])
        .then(() => {
          expect(openProject.getProject().cfg.port).to.eq(5544)
          expect(listen).to.be.calledWith(5544)
          expect(open).to.be.calledWithMatch({ port: 5544 })
          this.expectExitWith(0)
        })
      })

      // TODO: handle PORT_IN_USE short integration test
      it('logs error and exits when port is in use', async function () {
        sinon.stub(ProjectBase.prototype, 'getAutomation').returns({ use: () => {} })
        let server = http.createServer()

        server = Promise.promisifyAll(server)

        return server.listenAsync(5544, '127.0.0.1')
        .then(() => {
          return cypress.start([`--run-project=${this.todosPath}`, '--port=5544'])
        }).then(() => {
          this.expectExitWithErr('PORT_IN_USE_SHORT', '5544')
        })
      })
    })

    describe('--env', () => {
      beforeEach(() => {
        process.env = _.omit(process.env, 'CYPRESS_DEBUG')
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS

        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 0 } }
      })

      it('can set specific environment variables', function () {
        return cypress.start([
          `--run-project=${this.todosPath}`,
          '--video=false',
          '--env',
          'version=0.12.1,foo=bar,host=http://localhost:8888,baz=quux=dolor',
        ])
        .then(() => {
          expect(openProject.getProject().cfg.env).to.deep.eq({
            version: '0.12.1',
            foo: 'bar',
            host: 'http://localhost:8888',
            baz: 'quux=dolor',
          })

          this.expectExitWith(0)
        })
      })

      it('parses environment variables with empty values', function () {
        return cypress.start([
          `--run-project=${this.todosPath}`,
          '--video=false',
          '--env=FOO=,BAR=,BAZ=ipsum',
        ])
        .then(() => {
          expect(openProject.getProject().cfg.env).to.deep.eq({
            FOO: '',
            BAR: '',
            BAZ: 'ipsum',
          })

          this.expectExitWith(0)
        })
      })
    })

    describe('--config-file', () => {
      it(`with a custom config file fails when it doesn't exist`, function () {
        this.filename = 'abcdefgh.test.js'

        return fs.statAsync(path.join(this.todosPath, this.filename))
        .then(() => {
          throw new Error(`${this.filename} should not exist`)
        }).catch({ code: 'ENOENT' }, () => {
          return cypress.start([
            `--run-project=${this.todosPath}`,
            '--no-run-mode',
            '--config-file',
            this.filename,
          ]).then(() => {
            this.expectExitWithErr('CONFIG_FILE_NOT_FOUND', this.filename, this.todosPath)
          })
        })
      })
    })
  })

  // most record mode logic is covered in e2e tests.
  // we only need to cover the edge cases / warnings
  context('--record', () => {
    beforeEach(async function () {
      await clearCtx()

      sinon.stub(api, 'sendPreflight').resolves()
      sinon.stub(api, 'createRun').resolves()
      const createInstanceStub = sinon.stub(api, 'createInstance')

      api.setPreflightResult({ encrypt: false, apiUrl: 'http://localhost:1234' })

      createInstanceStub.onFirstCall().resolves({
        spec: 'cypress/e2e/app.cy.js',
        runs: [{}],
        runId: '1',
        claimedInstances: 1,
        totalInstances: 1,
        groupId: 1,
        platform: 'linux',
        machineId: 1,
      })

      createInstanceStub.onSecondCall().resolves({
        spec: null,
        runs: [{}],
        runId: '1',
        claimedInstances: 1,
        totalInstances: 1,
        groupId: 1,
        platform: 'linux',
        machineId: 1,
      })

      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      sinon.stub(browsers, 'open')

      globalThis.CY_TEST_MOCK = {
        waitForSocketConnection: true,
        waitForBrowserToConnect: true,
        waitForTestsToFinishRunning: {
          stats: {
            tests: 1,
            passes: 2,
            failures: 3,
            pending: 4,
            skipped: 5,
            wallClockDuration: 6,
          },
          tests: [],
          hooks: [],
          video: 'path/to/video',
          shouldUploadVideo: true,
          screenshots: [],
          config: {},
          spec: {},
        },
      }

      return Promise.all([
        // make sure we have no user object
        user.set({}),

        Promise.resolve()
        .then(() => {
          // Hardcoded so we don't need to create a project to source the config
          this.projectId = 'abc123'
        }),
      ])
    })

    afterEach(() => {
      api.resetPreflightResult()
    })

    it('uses process.env.CYPRESS_PROJECT_ID', function () {
      sinon.stub(env, 'get').withArgs('CYPRESS_PROJECT_ID').returns(this.projectId)

      return cypress.start([
        '--cwd=/foo/bar',
        `--run-project=${this.noScaffolding}`,
        '--record',
        '--key=token-123',
      ])
      .then(() => {
        expect(api.createRun).to.be.calledWithMatch({ projectId: this.projectId })
        expect(errors.warning).not.to.be.called
        this.expectExitWith(3)
      })
    })

    it('uses process.env.CYPRESS_RECORD_KEY', function () {
      sinon.stub(env, 'get')
      .withArgs('CYPRESS_PROJECT_ID').returns('foo-project-123')
      .withArgs('CYPRESS_RECORD_KEY').returns('token')

      return cypress.start([
        '--cwd=/foo/bar',
        `--run-project=${this.noScaffolding}`,
        '--record',
      ])
      .then(() => {
        expect(api.createRun).to.be.calledWithMatch({
          projectId: 'foo-project-123',
          recordKey: 'token',
        })

        expect(errors.warning).not.to.be.called
        this.expectExitWith(3)
      })
    })

    it('errors and exits when using --group but ciBuildId could not be generated', function () {
      sinon.stub(ciProvider, 'provider').returns(null)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--group=e2e-tests',
      ])
      .then(() => {
        this.expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs('INDETERMINATE_CI_BUILD_ID-group 1')
      })
    })

    it('errors and exits when using --parallel but ciBuildId could not be generated', function () {
      sinon.stub(ciProvider, 'provider').returns(null)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
      ])
      .then(() => {
        this.expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs('INDETERMINATE_CI_BUILD_ID-parallel 1')
      })
    })

    it('errors and exits when using --parallel and --group but ciBuildId could not be generated', function () {
      sinon.stub(ciProvider, 'provider').returns(null)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--group=e2e-tests-chrome',
        '--parallel',
      ])
      .then(() => {
        this.expectExitWithErr('INDETERMINATE_CI_BUILD_ID')

        return snapshotConsoleLogs('INDETERMINATE_CI_BUILD_ID-parallel-group 1')
      })
    })

    it('errors and exits when using --ci-build-id with no group or parallelization', function () {
      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--ci-build-id=ciBuildId123',
      ])
      .then(() => {
        this.expectExitWithErr('INCORRECT_CI_BUILD_ID_USAGE')

        return snapshotConsoleLogs('INCORRECT_CI_BUILD_ID_USAGE 1')
      })
    })

    it('errors and exits when using --ci-build-id without recording', function () {
      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--ci-build-id=ciBuildId123',
      ])
      .then(() => {
        this.expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-ciBuildId 1')
      })
    })

    it('errors and exits when using --group without recording', function () {
      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--group=e2e-tests',
      ])
      .then(() => {
        this.expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-group 1')
      })
    })

    it('errors and exits when using --parallel without recording', function () {
      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--parallel',
      ])
      .then(() => {
        this.expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-parallel 1')
      })
    })

    it('errors and exits when using --tag without recording', function () {
      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--tag=nightly',
      ])
      .then(() => {
        this.expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-tag 1')
      })
    })

    it('errors and exits when using --group and --parallel without recording', function () {
      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--parallel',
      ])
      .then(() => {
        this.expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-group-parallel 1')
      })
    })

    it('errors and exits when using --auto-cancel-after-failures without recording', function () {
      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        this.expectExitWithErr('RECORD_PARAMS_WITHOUT_RECORDING')

        return snapshotConsoleLogs('RECORD_PARAMS_WITHOUT_RECORDING-auto-cancel-after-failures 1')
      })
    })

    beforeEach(() => {
      browsers.open.restore()

      const ee = mockEE()

      sinon.stub(launch, 'launch').returns(ee)
      sinon.stub(Windows, 'create').returns(ee)
    })

    it('does not truncate a really long Cypress Cloud url', function () {
      api.createRun.resolves({
        warnings: [],
        runUrl: `http://cloud.cypress.io/this-is-a${'-long'.repeat(50)}-url`,
      })

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        return snapshotConsoleLogs('Long Cypress Cloud URL')
      })
    })

    it('errors and exits when group name is not unique and explicitly passed ciBuildId', function () {
      const err = new Error()

      err.statusCode = 422
      err.error = {
        code: 'RUN_GROUP_NAME_NOT_UNIQUE',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      api.createRun.rejects(err)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        this.expectExitWithErr('CLOUD_RUN_GROUP_NAME_NOT_UNIQUE')

        return snapshotConsoleLogs('CLOUD_RUN_GROUP_NAME_NOT_UNIQUE 1')
      })
    })

    it('errors and exits when parallel group params are different', function () {
      sinon.stub(system, 'info').returns({
        osName: 'darwin',
        osVersion: 'v1',
      })

      sinon.stub(browsers, 'ensureAndGetByNameOrPath').resolves({
        version: '59.1.2.3',
        displayName: 'Electron',
      })

      const err = new Error()

      err.statusCode = 422
      err.error = {
        code: 'PARALLEL_GROUP_PARAMS_MISMATCH',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
          differentParams: {
            browserName: {
              detected: 'Chrome',
              expected: 'Electron',
            },
            browserVersion: {
              detected: '65',
              expected: '64',
            },
          },
          differentSpecs: [
            'cypress/integration/foo_spec.js',
          ],
        },
      }

      api.createRun.rejects(err)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        this.expectExitWithErr('CLOUD_PARALLEL_GROUP_PARAMS_MISMATCH')

        return snapshotConsoleLogs('CLOUD_PARALLEL_GROUP_PARAMS_MISMATCH 1')
      })
    })

    it('errors and exits when parallel is not allowed', function () {
      const err = new Error()

      err.statusCode = 422
      err.error = {
        code: 'PARALLEL_DISALLOWED',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      api.createRun.rejects(err)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
      ])
      .then(() => {
        this.expectExitWithErr('CLOUD_PARALLEL_DISALLOWED')

        return snapshotConsoleLogs('CLOUD_PARALLEL_DISALLOWED 1')
      })
    })

    it('errors and exits when parallel is required', function () {
      const err = new Error()

      err.statusCode = 422
      err.error = {
        code: 'PARALLEL_REQUIRED',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      api.createRun.rejects(err)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        this.expectExitWithErr('CLOUD_PARALLEL_REQUIRED')

        return snapshotConsoleLogs('CLOUD_PARALLEL_REQUIRED 1')
      })
    })

    it('errors and exits when run is already complete', function () {
      const err = new Error()

      err.statusCode = 422
      err.error = {
        code: 'ALREADY_COMPLETE',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      api.createRun.rejects(err)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        this.expectExitWithErr('CLOUD_ALREADY_COMPLETE')

        return snapshotConsoleLogs('CLOUD_ALREADY_COMPLETE 1')
      })
    })

    it('errors and exits when run is stale', function () {
      const err = new Error()

      err.statusCode = 422
      err.error = {
        code: 'STALE_RUN',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      api.createRun.rejects(err)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--parallel',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        this.expectExitWithErr('CLOUD_STALE_RUN')

        return snapshotConsoleLogs('CLOUD_STALE_RUN 1')
      })
    })

    it('errors and exits when auto cancel mismatch', function () {
      const err = new Error()

      err.statusCode = 422
      err.error = {
        code: 'AUTO_CANCEL_MISMATCH',
        payload: {
          runUrl: 'https://cloud.cypress.io/runs/12345',
        },
      }

      api.createRun.rejects(err)

      return cypress.start([
        `--run-project=${this.recordPath}`,
        '--record',
        '--key=token-123',
        '--tag=nightly',
        '--group=electron-smoke-tests',
        '--ciBuildId=ciBuildId123',
        '--auto-cancel-after-failures=4',
      ])
      .then(() => {
        this.expectExitWithErr('CLOUD_AUTO_CANCEL_MISMATCH')

        return snapshotConsoleLogs('CLOUD_AUTO_CANCEL_MISMATCH 1')
      })
    })

    describe('cloud recommendation message', () => {
      it('does not display if --record is passed', function () {
        sinon.stub(ciProvider, 'getIsCi').returns(true)
        delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
        globalThis.CY_TEST_MOCK.listenForProjectEnd = { stats: { failures: 1 } }

        return cypress.start([
          `--run-project=${this.recordPath}`,
          '--record',
          '--key=token-123',
          '--group=electron-smoke-tests',
          '--ciBuildId=ciBuildId123',
          '--auto-cancel-after-failures=4',
        ])
        .then(() => {
          expect(console.log).not.to.be.calledWith(cloudRecommendationMessage)
        })
      })
    })
  })

  context('--return-pkg', () => {
    beforeEach(() => {
      console.log.restore()

      sinon.stub(console, 'log')
    })

    it('logs package.json and exits', function () {
      return cypress.start(['--return-pkg'])
      .then(() => {
        expect(console.log).to.be.calledWithMatch('{"name":"cypress"')
        this.expectExitWith(0)
      })
    })
  })

  context('--version', () => {
    beforeEach(() => {
      console.log.restore()

      sinon.stub(console, 'log')
    })

    it('logs version and exits', function () {
      return cypress.start(['--version'])
      .then(() => {
        expect(console.log).to.be.calledWith(pkg.version)
        this.expectExitWith(0)
      })
    })
  })

  context('--smoke-test', () => {
    beforeEach(() => {
      console.log.restore()

      sinon.stub(console, 'log')
    })

    it('logs pong value and exits', function () {
      return cypress.start(['--smoke-test', '--ping=abc123'])
      .then(() => {
        expect(console.log).to.be.calledWith('abc123')
        this.expectExitWith(0)
      })
    })
  })

  context('interactive', () => {
    beforeEach(async function () {
      this.win = {
        on: sinon.stub(),
        webContents: {
          on: sinon.stub(),
        },
      }

      await clearCtx()

      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      sinon.stub(Windows, 'open').resolves(this.win)
      sinon.stub(ServerE2E.prototype, 'startWebsockets')
      sinon.stub(electron.ipcMain, 'on')
    })

    it('passes options to interactiveMode.ready', () => {
      sinon.stub(interactiveMode, 'ready')

      return cypress.start(['--updating', '--port=2121', '--config=pageLoadTimeout=1000'])
      .then(() => {
        expect(interactiveMode.ready).to.be.calledWithMatch({
          updating: true,
          config: {
            port: 2121,
            pageLoadTimeout: 1000,
          },
        })
      })
    })

    // TODO: fix failing test https://github.com/cypress-io/cypress/issues/23149
    it.skip('passes filtered options to Project#open and sets cli config', async function () {
      const open = sinon.stub(ServerE2E.prototype, 'open').resolves([])

      sinon.stub(interactiveMode, 'ready')

      process.env.CYPRESS_FILE_SERVER_FOLDER = 'foo'
      process.env.CYPRESS_BASE_URL = 'http://localhost'
      process.env.CYPRESS_port = '2222'
      process.env.CYPRESS_responseTimeout = '5555'
      process.env.CYPRESS_watch_for_file_changes = 'false'

      setCtx(makeDataContext({}))

      await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.todosPath)

      return user.set({ name: 'brian', authToken: 'auth-token-123' })
      .then(() => ctx.lifecycleManager.getFullInitialConfig())
      .then((json) => {
        // this should be overridden by the env argument
        json.baseUrl = 'http://localhost:8080'

        // "pick" out the list of properties that cannot exist on the root level so we can re-add them on the "e2e" object
        // TODO: refactor this part of the test, this is silly and a holdover from pre-split-config
        const { experimentalRunAllSpecs, experimentalOriginDependencies, supportFile, specPattern, excludeSpecPattern, baseUrl, slowTestThreshold, testIsolation, ...rest } = json

        return settings.writeForTesting(this.todosPath, { ...rest, e2e: { experimentalRunAllSpecs, experimentalOriginDependencies, baseUrl, supportFile, specPattern, testIsolation, excludeSpecPattern } })
      }).then(async () => {
        await clearCtx()

        return cypress.start([
          '--port=2121',
          '--config',
          'pageLoadTimeout=1000',
          '--foo=bar',
          '--env=baz=baz',
        ])
      }).then(() => {
        const options = interactiveMode.ready.firstCall.args[0]

        return openProject.create(this.todosPath, { ...options, testingType: 'e2e' }, [])
      }).then(() => {
        const projectOptions = openProject.getProject().options

        expect(projectOptions.port).to.eq(2121)
        expect(projectOptions.pageLoadTimeout).to.eq(1000)
        expect(projectOptions.report).to.eq(false)
        expect(projectOptions.env).to.eql({ baz: 'baz' })

        expect(open).to.be.called

        const cfg = open.getCall(0).args[0]

        expect(cfg.fileServerFolder).to.eq(path.join(this.todosPath, 'foo'))
        expect(cfg.pageLoadTimeout).to.eq(1000)
        expect(cfg.port).to.eq(2121)
        expect(cfg.baseUrl).to.eq('http://localhost')
        expect(cfg.watchForFileChanges).to.be.false
        expect(cfg.responseTimeout).to.eq(5555)
        expect(cfg.env.baz).to.eq('baz')
        expect(cfg.env).not.to.have.property('fileServerFolder')
        expect(cfg.env).not.to.have.property('port')
        expect(cfg.env).not.to.have.property('BASE_URL')
        expect(cfg.env).not.to.have.property('watchForFileChanges')
        expect(cfg.env).not.to.have.property('responseTimeout')

        expect(cfg.resolved.fileServerFolder).to.deep.eq({
          value: 'foo',
          from: 'env',
        })

        expect(cfg.resolved.pageLoadTimeout).to.deep.eq({
          value: 1000,
          from: 'cli',
        })

        expect(cfg.resolved.port).to.deep.eq({
          value: 2121,
          from: 'cli',
        })

        expect(cfg.resolved.baseUrl).to.deep.eq({
          value: 'http://localhost',
          from: 'env',
        })

        expect(cfg.resolved.watchForFileChanges).to.deep.eq({
          value: false,
          from: 'env',
        })

        expect(cfg.resolved.responseTimeout).to.deep.eq({
          value: 5555,
          from: 'env',
        })

        expect(cfg.resolved.env.baz).to.deep.eq({
          value: 'baz',
          from: 'cli',
        })
      })
    })
  })

  context('--cwd', () => {
    beforeEach(async () => {
      await clearCtx()

      errors.warning.restore()
      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      sinon.stub(interactiveMode, 'ready').resolves()
      sinon.spy(errors, 'warning')
    })

    it('shows warning if Cypress has been started directly', () => {
      return cypress.start().then(() => {
        expect(errors.warning).to.be.calledWith('INVOKED_BINARY_OUTSIDE_NPM_MODULE')
        expect(console.log).to.be.calledWithMatch('It looks like you are running the Cypress binary directly.')
        expect(console.log).to.be.calledWithMatch('https://on.cypress.io/installing-cypress')
      })
    })

    it('does not show warning if finds --cwd', () => {
      return cypress.start(['--cwd=/foo/bar']).then(() => {
        expect(errors.warning).not.to.be.called
      })
    })
  })

  context('no args', () => {
    beforeEach(async () => {
      await clearCtx()
      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      sinon.stub(interactiveMode, 'ready').resolves()
    })

    it('runs interactiveMode and does not exit', () => {
      return cypress.start().then(() => {
        expect(interactiveMode.ready).to.be.calledOnce
      })
    })
  })
})
