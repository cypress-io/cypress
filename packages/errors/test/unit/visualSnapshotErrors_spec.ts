import chai, { expect } from 'chai'
import { app, BrowserWindow } from 'electron'
/* eslint-disable no-console */
import fse from 'fs-extra'
import globby from 'globby'
import _ from 'lodash'
import path from 'path'
import pixelmatch from 'pixelmatch'
import sinon, { SinonSpy } from 'sinon'
import { PNG } from 'pngjs'

import * as errors from '../../src'

// For importing the files below
process.env.CYPRESS_INTERNAL_ENV = 'test'

// require'd so the unsafe types from the server / missing types don't mix in here
const termToHtml = require('term-to-html')
const isCi = require('is-ci')
const { terminalBanner } = require('terminal-banner')
const ciProvider = require('@packages/server/lib/util/ci_provider')
const browsers = require('@packages/server/lib/browsers')
const launcherBrowsers = require('@packages/launcher/lib/browsers')

interface ErrorGenerator<T extends CypressErrorType> {
  default: Parameters<typeof errors.AllCypressErrors[T]>
  [key: string]: Parameters<typeof errors.AllCypressErrors[T]>
}

type CypressErrorType = keyof typeof errors.AllCypressErrors

chai.config.truncateThreshold = 0
chai.use(require('@cypress/sinon-chai'))

termToHtml.themes.dark.bg = '#111'

let win: BrowserWindow

const lineAndColNumsRe = /:\d+:\d+/

const EXT = '.png'

const copyImageToBase = (from: string, to: string) => {
  return fse.copy(from, to, { overwrite: true })
}

const convertHtmlToImage = async (htmlfile: string) => {
  const HEIGHT = 550
  const WIDTH = 1200

  await app.whenReady()

  if (!win) {
    win = new BrowserWindow({
      show: false,
      width: WIDTH,
      height: HEIGHT,
    })

    win.webContents.debugger.attach()
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Timed out creating Snapshot'))
    }, 2000)

    win.webContents.once('did-finish-load', async () => {
      try {
        await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride', {
          width: WIDTH,
          height: HEIGHT,
          deviceScaleFactor: 1,
          mobile: false,
        })

        const { data } = await win.webContents.debugger.sendCommand('Page.captureScreenshot', {
          format: 'png',
          quality: 100,
        })

        const imagePath = htmlfile.replace('.html', EXT)
        const baseImagePath = path.join(baseImageFolder, path.basename(imagePath))

        const receivedImageBuffer = Buffer.from(data, 'base64')
        const receivedPng = PNG.sync.read(receivedImageBuffer)
        const receivedPngBuffer = PNG.sync.write(receivedPng)

        await Promise.all([
          fse.outputFile(imagePath, receivedPngBuffer),
          fse.remove(htmlfile),
        ])

        // - if image does not exist in __snapshot-bases__
        //   then copy into __snapshot-bases__
        // - if image does exist then diff if, and if its
        //   greater than >.01 diff, then copy it in
        // - unless we're in CI, then fail if there's a diff
        try {
          const buf = await fse.readFile(baseImagePath)
          const existingPng = PNG.sync.read(buf)
          const diffPng = new PNG({ width: WIDTH, height: HEIGHT })
          const changed = pixelmatch(existingPng.data, receivedPng.data, diffPng.data, WIDTH, HEIGHT, { threshold: 0.1 })

          if (changed) {
            console.log({ changed })
            if (isCi) {
              return reject(new Error(`Image difference detected. Base error image no longer matches for file: ${baseImagePath}, off by ${changed} pixels`))
            }

            await copyImageToBase(imagePath, baseImagePath)
          }
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            await copyImageToBase(imagePath, baseImagePath)
          } else {
            reject(err)
          }
        } finally {
          resolve({})
        }
      } catch (e) {
        reject(e)
      }
    })

    win.loadFile(htmlfile).catch(reject)
  })
}

const outputHtmlFolder = path.join(__dirname, '..', '..', '__snapshot-images__')
const baseImageFolder = path.join(__dirname, '..', '..', '__snapshot-bases__')

const saveHtml = async (filename: string, html: string) => {
  await fse.outputFile(filename, html, 'utf8')
}

const cypressRootPath = path.join(__dirname, '..', '..', '..', '..')

const sanitize = (str: string) => {
  return str
  .split(lineAndColNumsRe).join('')
  .split(cypressRootPath).join('cypress')
}

const snapshotErrorConsoleLogs = function (errorFileName: string) {
  const logs = _
  .chain(consoleLog.args)
  .map((args) => {
    return args.map(sanitize).join(' ')
  })
  .join('\n')
  .value()

  // if the sanitized snapshot matches, let's save the ANSI colors converted into HTML
  const html = termToHtml
  .strings(logs, termToHtml.themes.dark.name)
  .split('color:#00A').join('color:#2472c7') // replace blue colors
  .split('color:#00A').join('color:#e05561') // replace red colors
  .split('color:#A50').join('color:#e5e510') // replace yellow colors
  .split('"Courier New", ').join('') // replace font
  .split('</style>').join(`
    body {
      margin: 5px;
      padding: 0;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
    }
    </style>
  `) // remove margin/padding and force text overflow like a terminal

  return saveHtml(errorFileName, html)
}

let consoleLog: SinonSpy

beforeEach(() => {
  consoleLog = sinon.spy(console, 'log')
})

afterEach(() => {
  sinon.restore()
})

const testVisualError = <K extends CypressErrorType> (errorGeneratorFn: () => ErrorGenerator<K>, errorType: K) => {
  it(errorType, async () => {
    const variants = errorGeneratorFn()

    expect(variants).to.be.an('object')

    for (const [key, arr] of Object.entries(variants)) {
      const filename = key === 'default' ? errorType : `${errorType} - ${key}`

      terminalBanner(filename)

      consoleLog.resetHistory()

      const err = errors.get(errorType, ...arr)

      errors.log(err)

      const htmlFilename = path.join(outputHtmlFolder, `${filename }.html`)

      await snapshotErrorConsoleLogs(htmlFilename)

      if (process.env.SKIP_IMAGE_CONVERSION !== '1') {
        await convertHtmlToImage(htmlFilename)
      }
    }
  })
}

const testVisualErrors = (whichError: CypressErrorType[] | '*', errorsToTest: {[K in CypressErrorType]: () => ErrorGenerator<K>}) => {
  // if we aren't testing all the errors
  if (whichError !== '*') {
    for (const errorToTest of whichError) {
      // then just test this individual error
      return testVisualError(errorsToTest[errorToTest], errorToTest)
    }
  }

  // otherwise test all the errors
  before(() => {
    // prune out all existing snapshot images in case
    // errors were removed and we have stale snapshots
    return fse.remove(outputHtmlFolder)
  })

  after(async () => {
    // if we're in CI, make sure there's all the files
    // we expect there to be in __snapshot-images__
    if (isCi) {
      const files = await globby(`${outputHtmlFolder}/*`)
      const errorImageNames = files.map((file) => {
        return path.basename(file, '.png').split(' ')[0]
      })
      const uniqErrors = _.uniq(errorImageNames)
      const excessImages = _.difference(uniqErrors, _.keys(errors.AllCypressErrors))

      await Promise.all(excessImages.map((img) => {
        const pathToImage = path.join(baseImageFolder, img + EXT)

        return fse.remove(pathToImage)
      }))

      expect(uniqErrors).to.deep.eq(_.keys(errors.AllCypressErrors))
    }
  })

  // test each error visually
  // @ts-expect-error
  _.forEach(errorsToTest, testVisualError)

  // if we are testing all the errors then make sure we
  // have a test to validate that we've written a test
  // for each error type
  it('ensures there are matching tests for each cypress error', () => {
    const { missingErrorTypes, excessErrorTypes } = _
    .chain(errors.AllCypressErrors)
    .keys()
    .thru((errorTypes) => {
      const errorsToTestTypes = _.keys(errorsToTest)

      return {
        missingErrorTypes: _.difference(errorTypes, errorsToTestTypes),
        excessErrorTypes: _.difference(errorsToTestTypes, errorTypes),
      }
    })
    .value()

    expect(missingErrorTypes, 'you are missing tests around the following error types').to.be.empty
    expect(excessErrorTypes, 'you have added excessive tests for errors which do not exist').to.be.empty
  })
}

const makeErr = () => {
  const err = new Error('fail whale')

  err.stack = err.stack?.split('\n').slice(0, 4).join('\n') ?? ''

  return err as Error & {stack: string}
}

testVisualErrors('*', {
// testVisualErrors('CANNOT_TRASH_ASSETS', {
  CANNOT_TRASH_ASSETS: () => {
    const err = makeErr()

    return {
      default: [err.stack],
    }
  },
  CANNOT_REMOVE_OLD_BROWSER_PROFILES: () => {
    const err = makeErr()

    return {
      default: [err.stack],
    }
  },
  VIDEO_RECORDING_FAILED: () => {
    const err = makeErr()

    return {
      default: [err.stack],
    }
  },
  VIDEO_POST_PROCESSING_FAILED: () => {
    const err = makeErr()

    return {
      default: [err.stack],
    }
  },
  CHROME_WEB_SECURITY_NOT_SUPPORTED: () => {
    return {
      default: ['electron'],
    }
  },
  BROWSER_NOT_FOUND_BY_NAME: () => {
    return {
      default: ['invalid-browser', browsers.formatBrowsersToOptions(launcherBrowsers.browsers)],
      canary: ['canary', browsers.formatBrowsersToOptions(launcherBrowsers.browsers)],
    }
  },
  BROWSER_NOT_FOUND_BY_PATH: () => {
    const err = makeErr()

    return {
      default: ['/path/does/not/exist', err.message],
    }
  },
  NOT_LOGGED_IN: () => {
    return {
      default: [],
    }
  },
  TESTS_DID_NOT_START_RETRYING: () => {
    return {
      default: ['Retrying...'],
      retryingAgain: ['Retrying again...'],
    }
  },
  TESTS_DID_NOT_START_FAILED: () => {
    return {
      default: [],
    }
  },
  DASHBOARD_CANCEL_SKIPPED_SPEC: () => {
    return {
      default: [],
    }
  },
  DASHBOARD_API_RESPONSE_FAILED_RETRYING: () => {
    return {
      default: [{ tries: 3, delay: 5000, response: '500 server down' }],
    }
  },
  DASHBOARD_CANNOT_PROCEED_IN_PARALLEL: () => {
    return {
      default: [{ flags: { ciBuildId: 'invalid', group: 'foo' }, response: 'Invalid CI Build ID' }],
    }
  },
  DASHBOARD_CANNOT_PROCEED_IN_SERIAL: () => {
    return {
      default: [{ flags: { ciBuildId: 'invalid', group: 'foo' }, response: 'Invalid CI Build ID' }],
    }
  },
  DASHBOARD_UNKNOWN_INVALID_REQUEST: () => {
    return {
      default: [{ flags: { ciBuildId: 'invalid', group: 'foo' }, response: 'Unexpected 500 Error' }],
    }
  },
  DASHBOARD_UNKNOWN_CREATE_RUN_WARNING: () => {
    return {
      default: [{ props: { ciBuildId: 'invalid', group: 'foo' }, message: 'You have been warned' }],
    }
  },
  DASHBOARD_STALE_RUN: () => {
    return {
      default: [{ runUrl: 'https://dashboard.cypress.io/project/abcd/runs/1', tag: '123', group: 'foo', parallel: true }],
    }
  },
  DASHBOARD_ALREADY_COMPLETE: () => {
    return {
      default: [{ runUrl: 'https://dashboard.cypress.io/project/abcd/runs/1', tag: '123', group: 'foo', parallel: true }],
    }
  },
  DASHBOARD_PARALLEL_REQUIRED: () => {
    return {
      default: [{ runUrl: 'https://dashboard.cypress.io/project/abcd/runs/1', tag: '123', group: 'foo', parallel: true }],
    }
  },
  DASHBOARD_PARALLEL_DISALLOWED: () => {
    return {
      default: [{ runUrl: 'https://dashboard.cypress.io/project/abcd/runs/1', tag: '123', group: 'foo', parallel: true }],
    }
  },
  DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH: () => {
    return {
      default: [
        {
          group: 'foo',
          runUrl: 'https://dashboard.cypress.io/project/abcd/runs/1',
          ciBuildId: 'test-ciBuildId-123',
          parameters: {
            osName: 'darwin',
            osVersion: 'v1',
            browserName: 'Electron',
            browserVersion: '59.1.2.3',
            specs: [
              'cypress/integration/app_spec.js',
            ],
          },
        },
      ],
    }
  },
  DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE: () => {
    return {
      default: [{ runUrl: 'https://dashboard.cypress.io/project/abcd/runs/1', tag: '123', group: 'foo', parallel: true }],
    }
  },
  DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS: () => {
    return {
      default: [],
    }
  },
  DUPLICATE_TASK_KEY: () => {
    return {
      default: ['foo, bar, baz'],
    }
  },
  INDETERMINATE_CI_BUILD_ID: () => {
    return {
      default: [
        { group: 'foo', parallel: 'false' },
        ciProvider.detectableCiBuildIdProviders(),
      ],
    }
  },
  RECORD_PARAMS_WITHOUT_RECORDING: () => {
    return {
      default: [{ parallel: 'true' }],
    }
  },
  INCORRECT_CI_BUILD_ID_USAGE: () => {
    return {
      default: [{ ciBuildId: 'ciBuildId123' }],
    }
  },
  RECORD_KEY_MISSING: () => {
    return {
      default: [],
    }
  },
  CANNOT_RECORD_NO_PROJECT_ID: () => {
    return {
      default: ['/path/to/cypress.json'],
    }
  },
  PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION: () => {
    return {
      default: ['abc123'],
    }
  },
  DASHBOARD_INVALID_RUN_REQUEST: () => {
    return {
      default: [{ message: 'Error on Run Request', errors: [], object: {} }],
    }
  },
  RECORDING_FROM_FORK_PR: () => {
    return {
      default: [],
    }
  },
  DASHBOARD_CANNOT_UPLOAD_RESULTS: () => {
    const err = makeErr()

    return {
      default: [err],
    }
  },
  DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE: () => {
    const err = makeErr()

    return {
      default: [err],
    }
  },
  DASHBOARD_RECORD_KEY_NOT_VALID: () => {
    return {
      default: ['record-key-1234', 'projectId'],
    }
  },
  DASHBOARD_PROJECT_NOT_FOUND: () => {
    return {
      default: ['abc123', '/path/to/cypress.json'],
    }
  },
  NO_PROJECT_ID: () => {
    return {
      default: ['cypress.json', '/path/to/project'],
    }
  },
  NO_PROJECT_FOUND_AT_PROJECT_ROOT: () => {
    return {
      default: ['/path/to/project'],
    }
  },
  CANNOT_FETCH_PROJECT_TOKEN: () => {
    return {
      default: [],
    }
  },
  CANNOT_CREATE_PROJECT_TOKEN: () => {
    return {
      default: [],
    }
  },
  PORT_IN_USE_SHORT: () => {
    return {
      default: [2020],
    }
  },
  PORT_IN_USE_LONG: () => {
    return {
      default: [2020],
    }
  },
  ERROR_READING_FILE: () => {
    return {
      default: ['/path/to/read/file.ts', makeErr()],
    }
  },
  ERROR_WRITING_FILE: () => {
    return {
      default: ['path/to/write/file.ts', makeErr()],
    }
  },
  NO_SPECS_FOUND: () => {
    return {
      default: ['/path/to/project/root', '**_spec.js'],
      noPattern: ['/path/to/project/root'],
    }
  },
  RENDERER_CRASHED: () => {
    return {
      default: [],
    }
  },
  AUTOMATION_SERVER_DISCONNECTED: () => {
    return {
      default: [],
    }
  },
  SUPPORT_FILE_NOT_FOUND: () => {
    return {
      default: ['/path/to/supportFile', '/path/to/cypress.json'],
    }
  },
  PLUGINS_FILE_ERROR: () => {
    const err = makeErr()

    return {
      default: ['/path/to/pluginsFile', err],
    }
  },
  PLUGINS_DIDNT_EXPORT_FUNCTION: () => {
    return {
      default: ['/path/to/pluginsFile', () => 'some function'],
    }
  },
  PLUGINS_FUNCTION_ERROR: () => {
    const err = makeErr()

    return {
      default: ['/path/to/pluginsFile', err],
    }
  },
  PLUGINS_UNEXPECTED_ERROR: () => {
    const err = makeErr()

    return {
      default: ['/path/to/pluginsFile', err],
    }
  },
  PLUGINS_VALIDATION_ERROR: () => {
    const err = makeErr()

    return {
      default: ['/path/to/pluginsFile', err],
    }
  },
  BUNDLE_ERROR: () => {
    const err = makeErr()

    return {
      default: ['/path/to/file', err.message],
    }
  },
  SETTINGS_VALIDATION_ERROR: () => {
    const err = makeErr()

    return {
      default: ['/path/to/file', err.message],
    }
  },
  PLUGINS_CONFIG_VALIDATION_ERROR: () => {
    const err = makeErr()

    return {
      default: ['/path/to/pluginsFile', err.message],
    }
  },
  CONFIG_VALIDATION_ERROR: () => {
    const err = makeErr()

    return {
      default: [err.message],
    }
  },
  RENAMED_CONFIG_OPTION: () => {
    return {
      default: [{ name: 'oldName', newName: 'newName' }],
    }
  },
  CANNOT_CONNECT_BASE_URL: () => {
    return {
      default: [],
    }
  },
  CANNOT_CONNECT_BASE_URL_WARNING: () => {
    return {
      default: ['http://localhost:3000'],
    }
  },
  CANNOT_CONNECT_BASE_URL_RETRYING: () => {
    return {
      default: [{ attempt: 0, baseUrl: 'http://localhost:3000', remaining: 60, delay: 500 }],
    }
  },
  INVALID_REPORTER_NAME: () => {
    return {
      default: [{
        name: 'missing-reporter-name',
        paths: ['/path/to/reporter', '/path/reporter'],
        error: `stack-trace`,
      }],
    }
  },
  NO_DEFAULT_CONFIG_FILE_FOUND: () => {
    return {
      default: ['/path/to/project/root'],
    }
  },
  CONFIG_FILES_LANGUAGE_CONFLICT: () => {
    return {
      default: [
        'cypress.config.js',
        'cypress.config.ts',
        '/path/to/project/root',
      ],
    }
  },
  CONFIG_FILE_NOT_FOUND: () => {
    return {
      default: ['cypress.json', '/path/to/project/root'],
    }
  },
  INVOKED_BINARY_OUTSIDE_NPM_MODULE: () => {
    return {
      default: [],
    }
  },
  FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS: () => {
    return {
      default: [{
        link: 'https://dashboard.cypress.io/project/abcd',
        planType: 'Test Plan',
        usedTestsMessage: 'The limit is 500 free results',
      }],
    }
  },
  FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS: () => {
    return {
      default: [{
        link: 'https://dashboard.cypress.io/project/abcd',
        planType: 'Grace Period Plan',
        usedTestsMessage: 'The limit is 500 free results',
        gracePeriodMessage: 'You are on a grace period for 20 days',
      }],
    }
  },
  PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing', planType: 'Test Plan', usedTestsMessage: 'The limit is 500 free results' }],
    }
  },
  FREE_PLAN_EXCEEDS_MONTHLY_TESTS: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing', planType: 'Test Plan', usedTestsMessage: 'The limit is 500 free results' }],
    }
  },
  FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing', planType: 'Test Plan', usedTestsMessage: 'The limit is 500 free results', gracePeriodMessage: 'Feb 1, 2022' }],
    }
  },
  PLAN_EXCEEDS_MONTHLY_TESTS: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing', planType: 'Test Plan', usedTestsMessage: 'The limit is 500 free results' }],
    }
  },
  FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing', gracePeriodMessage: 'Feb 1, 2022' }],
    }
  },
  PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing' }],
    }
  },
  PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing', gracePeriodMessage: 'Feb 1, 2022' }],
    }
  },
  RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN: () => {
    return {
      default: [{ link: 'https://on.cypress.io/set-up-billing' }],
    }
  },
  FIXTURE_NOT_FOUND: () => {
    return {
      default: ['file', ['js', 'ts', 'json']],
    }
  },
  AUTH_COULD_NOT_LAUNCH_BROWSER: () => {
    return {
      default: ['http://dashboard.cypress.io/login'],
    }
  },
  AUTH_BROWSER_LAUNCHED: () => {
    return {
      default: [],
    }
  },
  BAD_POLICY_WARNING: () => {
    return {
      default: [[
        'HKEY_LOCAL_MACHINE\\Software\\Policies\\Google\\Chrome\\ProxyServer',
        'HKEY_CURRENT_USER\\Software\\Policies\\Google\\Chromium\\ExtensionSettings',
      ]],
    }
  },
  BAD_POLICY_WARNING_TOOLTIP: () => {
    return {
      default: [],
    }
  },
  EXTENSION_NOT_LOADED: () => {
    return {
      default: ['Electron', '/path/to/extension'],
    }
  },
  COULD_NOT_FIND_SYSTEM_NODE: () => {
    return {
      default: ['16.2.1'],
    }
  },
  INVALID_CYPRESS_INTERNAL_ENV: () => {
    return {
      default: ['foo'],
    }
  },
  CDP_VERSION_TOO_OLD: () => {
    return {
      default: ['89', { major: 90, minor: 2 }],
    }
  },
  CDP_COULD_NOT_CONNECT: () => {
    return {
      default: ['chrome', '2345', makeErr()],
    }
  },
  FIREFOX_COULD_NOT_CONNECT: () => {
    const err = makeErr()

    return {
      default: [err],
    }
  },
  CDP_COULD_NOT_RECONNECT: () => {
    const err = makeErr()

    return {
      default: [err],
    }
  },
  CDP_RETRYING_CONNECTION: () => {
    return {
      default: [1, 'chrome'],
    }
  },
  UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES: () => {
    return {
      default: [
        ['baz'], ['preferences', 'extensions', 'args'],
      ],
    }
  },
  COULD_NOT_PARSE_ARGUMENTS: () => {
    return {
      default: ['spec', '1', 'spec must be a string or comma-separated list'],
    }
  },
  FIREFOX_MARIONETTE_FAILURE: () => {
    const err = makeErr()

    return {
      default: ['connection', err],
    }
  },
  FOLDER_NOT_WRITABLE: () => {
    return {
      default: ['/path/to/folder'],
    }
  },
  EXPERIMENTAL_SAMESITE_REMOVED: () => {
    return {
      default: [],
    }
  },
  EXPERIMENTAL_COMPONENT_TESTING_REMOVED: () => {
    return {
      default: [{ configFile: '/path/to/configFile.json' }],
    }
  },
  EXPERIMENTAL_SHADOW_DOM_REMOVED: () => {
    return {
      default: [],
    }
  },
  EXPERIMENTAL_NETWORK_STUBBING_REMOVED: () => {
    return {
      default: [],
    }
  },
  EXPERIMENTAL_RUN_EVENTS_REMOVED: () => {
    return {
      default: [],
    }
  },
  FIREFOX_GC_INTERVAL_REMOVED: () => {
    return {
      default: [],
    }
  },
  INCOMPATIBLE_PLUGIN_RETRIES: () => {
    return {
      default: ['./path/to/cypress-plugin-retries'],
    }
  },
  NODE_VERSION_DEPRECATION_BUNDLED: () => {
    return {
      default: [{ name: 'nodeVersion', value: 'bundled', 'configFile': 'cypress.json' }],
    }
  },
  NODE_VERSION_DEPRECATION_SYSTEM: () => {
    return {
      default: [{ name: 'nodeVersion', value: 'system', 'configFile': 'cypress.json' }],
    }
  },
  CT_NO_DEV_START_EVENT: () => {
    return {
      default: ['/path/to/plugins/file.js'],
    }
  },
  PLUGINS_RUN_EVENT_ERROR: () => {
    return {
      default: ['before:spec', makeErr()],
    }
  },
  INVALID_CONFIG_OPTION: () => {
    return {
      default: [['test', 'foo']],
    }
  },
  UNSUPPORTED_BROWSER_VERSION: () => {
    return {
      default: [`Cypress does not support running chrome version 64. To use chrome with Cypress, install a version of chrome newer than or equal to 64.`],
    }
  },
})
