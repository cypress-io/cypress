import Bluebird from 'bluebird'
import chai, { expect } from 'chai'
import { app, BrowserWindow } from 'electron'
/* eslint-disable no-console */
import fse from 'fs-extra'
import globby from 'globby'
import isCi from 'is-ci'
import _ from 'lodash'
import path from 'path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sinon, { SinonSpy } from 'sinon'
import termToHtml from 'term-to-html'
import { terminalBanner } from 'terminal-banner'
import * as errors from '../../src'

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

const copyImageToBase = (from, to) => {
  return fse.copy(from, to, { overwrite: true })
}

const convertHtmlToImage = (htmlfile) => {
  const HEIGHT = 550
  const WIDTH = 1200

  return app.whenReady()
  .then(() => {
    if (!win) {
      win = new BrowserWindow({
        show: false,
        width: WIDTH,
        height: HEIGHT,
      })

      win.webContents.debugger.attach()
    }

    return new Bluebird((resolve, reject) => {
      win.webContents.once('did-finish-load', (evt) => {
        return win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride', {
          width: WIDTH,
          height: HEIGHT,
          deviceScaleFactor: 1,
          mobile: false,
        })
        .then(() => {
          return win.webContents.debugger.sendCommand('Page.captureScreenshot', {
            format: 'png',
            quality: 100,
          })
        })
        .then(({ data }) => {
          const imagePath = htmlfile.replace('.html', EXT)
          const baseImagePath = path.join(baseImageFolder, path.basename(imagePath))

          const receivedImageBuffer = Buffer.from(data, 'base64')
          const receivedPng = PNG.sync.read(receivedImageBuffer)
          const receivedPngBuffer = PNG.sync.write(receivedPng)

          return Promise.all([
            fse.outputFile(imagePath, receivedPngBuffer),
            fse.remove(htmlfile),
          ])
          .then(() => {
            // - if image does not exist in __snapshot-bases__
            //   then copy into __snapshot-bases__
            // - if image does exist then diff if, and if its
            //   greater than >.01 diff, then copy it in
            // - unless we're in CI, then fail if there's a diff
            return fse.readFile(baseImagePath)
            .then((buf) => {
              const existingPng = PNG.sync.read(buf)
              const diffPng = new PNG({ width: WIDTH, height: HEIGHT })

              const changed = pixelmatch(existingPng.data, receivedPng.data, diffPng.data, WIDTH, HEIGHT, { threshold: 0.1 })

              if (changed) {
                if (isCi) {
                  throw new Error(`Image difference detected. Base error image no longer matches for file: ${baseImagePath}`)
                }

                return copyImageToBase(imagePath, baseImagePath)
              }
            })
            .catch((err) => {
              if (err.code === 'ENOENT') {
                return copyImageToBase(imagePath, baseImagePath)
              }
            })
          })
          .then(resolve)
        })
        .catch(reject)
      })

      win.loadFile(htmlfile)
    })
    .timeout(2000)
  })
}

const outputHtmlFolder = path.join(__dirname, '..', '..', '__snapshot-images__')
const baseImageFolder = path.join(__dirname, '..', '..', '__snapshot-bases__')

const saveHtml = async (filename, html) => {
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
  .split('Courier New').join('MesloLGS NF') // replace font
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
  it(errorType, () => {
    const variants = errorGeneratorFn()

    expect(variants).to.be.an('object')

    const snapshots = _.mapValues(variants, (arr, key: string) => {
      const filename = key === 'default' ? errorType : `${errorType} - ${key}`

      terminalBanner(filename)

      consoleLog.resetHistory()

      const err = errors.get(errorType, ...arr)

      errors.log(err)

      const htmlFilename = path.join(outputHtmlFolder, `${filename }.html`)

      return snapshotErrorConsoleLogs(htmlFilename)
      .then(() => {
        if (process.env.SKIP_IMAGE_CONVERSION !== '1') {
          return convertHtmlToImage(htmlFilename)
        }
      })
    })

    return Bluebird.props(snapshots)
  })
}

const testVisualErrors = (whichError: CypressErrorType | '*', errorsToTest: {[K in CypressErrorType]: () => ErrorGenerator<K>}) => {
  // if we aren't testing all the errors
  if (whichError !== '*') {
    // then just test this individual error
    return testVisualError(errorsToTest[whichError], whichError)
  }

  // otherwise test all the errors
  before(() => {
    // prune out all existing snapshot images in case
    // errors were removed and we have stale snapshots
    return fse.remove(outputHtmlFolder)
  })

  after(() => {
    // if we're in CI, make sure there's all the files
    // we expect there to be in __snapshot-images__
    if (isCi) {
      return Bluebird.resolve()
      .then(() => {
        return globby(`${outputHtmlFolder}/*`)
      })
      .map((file) => {
        return path.basename(file, EXT).split(' ')[0]
      })
      .then((errorImageNames) => {
        const uniqErrors = _.uniq(errorImageNames)

        expect(uniqErrors).to.deep.eq(_.keys(errors.AllCypressErrors))
      })
    }

    // otherwise if we're local, then prune out anything from
    // __snapshot-bases__ that's stale
    return Bluebird.resolve()
    .then(() => {
      return globby(`${baseImageFolder}/*`)
    })
    .map((file) => {
      return path.basename(file, EXT).split(' ')[0]
    })
    .then((errorImageNames) => {
      const excessImages = _
      .chain(errorImageNames)
      .uniq()
      .difference(_.keys(errors.AllCypressErrors))
      .value()

      return Bluebird.map(excessImages, (img) => {
        const pathToImage = path.join(baseImageFolder, img + EXT)

        return fse.remove(pathToImage)
      })
    })
  })

  // test each error visually
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

  err.stack = err.stack.split('\n').slice(0, 4).join('\n')

  return err
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
    // const err = makeErr()

    // return {
    //   default: [err.stack],
    // }
  },
  BROWSER_NOT_FOUND_BY_NAME: () => {

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

  },
  DASHBOARD_CANNOT_PROCEED_IN_PARALLEL: () => {

  },
  DASHBOARD_CANNOT_PROCEED_IN_SERIAL: () => {

  },
  DASHBOARD_UNKNOWN_INVALID_REQUEST: () => {

  },
  DASHBOARD_UNKNOWN_CREATE_RUN_WARNING: () => {

  },
  DASHBOARD_STALE_RUN: () => {

  },
  DASHBOARD_ALREADY_COMPLETE: () => {

  },
  DASHBOARD_PARALLEL_REQUIRED: () => {

  },
  DASHBOARD_PARALLEL_DISALLOWED: () => {

  },
  DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH: () => {

  },
  DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE: () => {

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

  },
  RECORD_PARAMS_WITHOUT_RECORDING: () => {

  },
  INCORRECT_CI_BUILD_ID_USAGE: () => {

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

  },
  ERROR_WRITING_FILE: () => {

  },
  NO_SPECS_FOUND: () => {

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

  },
  INVALID_REPORTER_NAME: () => {

  },
  NO_DEFAULT_CONFIG_FILE_FOUND: () => {
    return {
      default: ['/path/to/project/root'],
    }
  },
  CONFIG_FILES_LANGUAGE_CONFLICT: () => {

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

  },
  FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS: () => {

  },
  PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS: () => {

  },
  FREE_PLAN_EXCEEDS_MONTHLY_TESTS: () => {

  },
  FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS: () => {

  },
  PLAN_EXCEEDS_MONTHLY_TESTS: () => {

  },
  FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE: () => {

  },
  PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN: () => {

  },
  PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED: () => {

  },
  RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN: () => {

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

  },
  BAD_POLICY_WARNING_TOOLTIP: () => {
    return {
      default: [],
    }
  },
  EXTENSION_NOT_LOADED: () => {

  },
  COULD_NOT_FIND_SYSTEM_NODE: () => {

  },
  INVALID_CYPRESS_INTERNAL_ENV: () => {
    return {
      default: ['foo'],
    }
  },
  CDP_VERSION_TOO_OLD: () => {

  },
  CDP_COULD_NOT_CONNECT: () => {

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

  },
  UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES: () => {

  },
  COULD_NOT_PARSE_ARGUMENTS: () => {

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
})
