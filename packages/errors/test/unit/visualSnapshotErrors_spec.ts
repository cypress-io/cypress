/* eslint-disable no-console */
import chai, { expect } from 'chai'
import Debug from 'debug'
import fse from 'fs-extra'
import globby from 'globby'
import _ from 'lodash'
import path from 'path'
import sinon, { SinonSpy } from 'sinon'
import * as errors from '../../src'
import { convertHtmlToImage } from '../support/utils'
import os from 'os'

// For importing the files below
process.env.CYPRESS_INTERNAL_ENV = 'test'

// require'd so the unsafe types from the server / missing types don't mix in here
const termToHtml = require('term-to-html')
const isCi = require('is-ci')
const { terminalBanner } = require('terminal-banner')
const ciProvider = require('@packages/server/lib/util/ci_provider')
const browsers = require('@packages/server/lib/browsers')
const { knownBrowsers } = require('@packages/launcher/lib/known-browsers')

const debug = Debug(isCi ? '*' : 'visualSnapshotErrors')

let snapshotFailures = 0

after(() => {
  if (snapshotFailures > 0) {
    console.log(`
      =================================

      Snapshot failures see for visualSnapshotErrors.

      Run "yarn comparison" locally from the @packages/error package to resolve

      =================================
    `)
  }
})

interface ErrorGenerator<T extends CypressErrorType> {
  default: Parameters<typeof errors.AllCypressErrors[T]>
  [key: string]: Parameters<typeof errors.AllCypressErrors[T]>
}

type CypressErrorType = keyof typeof errors.AllCypressErrors

chai.config.truncateThreshold = 0
chai.use(require('@cypress/sinon-chai'))

termToHtml.themes.dark.bg = '#111'

const lineAndColNumsRe = /:\d+:\d+/

const snapshotHtmlFolder = path.join(__dirname, '..', '..', '__snapshot-html__')
const snapshotHtmlLocalFolder = path.join(__dirname, '..', '..', '__snapshot-html-local__')
const snapshotMarkdownFolder = path.join(__dirname, '..', '..', '__snapshot-md__')
const snapshotImagesFolder = path.join(__dirname, '..', '..', '__snapshot-images__')

const saveHtml = async (filename: string, html: string) => {
  await fse.outputFile(filename, html, 'utf8')
}

const cypressRootPath = path.join(__dirname, '..', '..', '..', '..')

const sanitize = (str: string) => {
  return str
  .split(lineAndColNumsRe).join('')
  .split(cypressRootPath).join('cypress')
  .split(os.tmpdir()).join('/os/tmpdir')
}

const snapshotAndTestErrorConsole = async function (errorFileName: string) {
  const logs = _
  .chain(consoleLog.args)
  .map((args) => args.map(sanitize).join(' '))
  .join('\n')
  .value()

  // if the sanitized snapshot matches, let's save the ANSI colors converted into HTML
  const html = termToHtml
  .strings(logs, termToHtml.themes.dark.name)
  .split('color:#55F').join('color:#4ec4ff') // replace blueBright colors
  .split('color:#A00').join('color:#e05561') // replace red colors
  .split('color:#A50').join('color:#e5e510') // replace yellow colors
  .split('color:#555').join('color:#4f5666') // replace gray colors
  .split('color:#eee').join('color:#e6e6e6') // replace white colors
  .split('color:#A0A').join('color:#c062de') // replace magenta colors
  .split('color:#F5F').join('color:#de73ff') // replace magentaBright colors
  .split('"Courier New", ').join('"Courier Prime", ') // replace font
  .split('<style>').join(`
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap" rel="stylesheet">
    <style>
  `)
  .split('</style>').join(`
    body {
      margin: 5px;
      padding: 0;
      overflow: hidden;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      -webkit-font-smoothing: antialiased;
    }
    </style>
  `) // remove margin/padding and force text overflow like a terminal

  if (isCi) {
    expect(logs).not.to.contain('[object Object]')
  }

  try {
    fse.accessSync(errorFileName)
  } catch (e) {
    await saveHtml(errorFileName, html)
  }

  const contents = await fse.readFile(errorFileName, 'utf8')

  try {
    expect(contents).to.eq(html)
  } catch (e) {
    snapshotFailures++
    await saveHtml(errorFileName.replace('__snapshot-html__', '__snapshot-html-local__'), html)
    throw e
  }
}

let consoleLog: SinonSpy

beforeEach(() => {
  sinon.restore()
  consoleLog = sinon.spy(console, 'log')
})

afterEach(() => {
  sinon.restore()
})

const testVisualError = <K extends CypressErrorType> (errorGeneratorFn: () => ErrorGenerator<K>, errorType: K) => {
  const variants = errorGeneratorFn()

  expect(variants).to.be.an('object')

  for (const [key, arr] of Object.entries(variants)) {
    const filename = key === 'default' ? errorType : `${errorType} - ${key}`

    it(`${errorType} - ${key}`, async () => {
      debug(`Converting ${filename}`)

      terminalBanner(filename)

      consoleLog.resetHistory()

      const err = errors.get(errorType, ...arr)

      if (!errors.isCypressErr(err)) {
        throw new Error(`Expected Cypress Error`)
      }

      errors.log(err)

      const htmlFilename = path.join(snapshotHtmlFolder, `${filename}.html`)
      const mdFilename = path.join(snapshotMarkdownFolder, `${filename}.md`)

      await snapshotAndTestErrorConsole(htmlFilename)

      await fse.outputFile(mdFilename, err.messageMarkdown, 'utf8')

      debug(`Snapshotted ${htmlFilename}`)

      // dont run html -> image conversion if we're in CI / if not enabled
      if (!isCi && process.env.HTML_IMAGE_CONVERSION) {
        debug(`Converting ${errorType} to image`)

        await convertHtmlToImage(htmlFilename, snapshotImagesFolder)

        debug(`Conversion complete for ${errorType}`)
      }
    }).timeout(5000)
  }
}

const testVisualErrors = (whichError: CypressErrorType | '*', errorsToTest: {[K in CypressErrorType]: () => ErrorGenerator<K>}) => {
  // if we aren't testing all the errors
  if (whichError !== '*') {
    // then just test this individual error
    return testVisualError(errorsToTest[whichError], whichError)
  }

  // otherwise test all the errors
  before(() => {
    // prune out all existing local staging folders
    return Promise.all([
      fse.remove(snapshotMarkdownFolder),
      fse.remove(snapshotHtmlLocalFolder),
      fse.remove(snapshotImagesFolder),
    ])
  })

  after(async () => {
    // if we're in CI, make sure there's all the files
    // we expect there to be in __snapshot-html__
    const files = await globby(`${snapshotHtmlFolder}/*`)
    const errorKeys = _.keys(errors.AllCypressErrors)

    if (isCi) {
      const errorNames = files.map((file) => {
        return path.basename(file, '.html').split(' ')[0]
      })
      const uniqErrors = _.uniq(errorNames)
      // const excessErrors = _.difference(uniqErrors, _.keys(errors.AllCypressErrors))

      // await Promise.all(excessErrors.map((file) => {
      //   const pathToHtml = path.join(baseImageFolder, file + EXT)
      //   return fse.remove(pathToHtml)
      // }))

      const sortedUniqErrors = uniqErrors.sort()
      const sortedErrorKeys = errorKeys.sort()

      _.each(sortedUniqErrors, (val, index) => {
        expect(val).to.eq(sortedErrorKeys[index])
      })
    } else {
      const errorFiles = files.map((file) => {
        return {
          errorType: path.basename(file, '.html').split(' ')[0],
          filePath: file,
        }
      })
      const excessErrors = _
      .chain(errorFiles)
      .map('errorType')
      .uniq()
      .difference(errorKeys)
      .value()

      return Promise.all(
        errorFiles
        .filter((obj) => {
          return _.includes(excessErrors, obj.errorType)
        })
        .map((obj) => {
          return fse.remove(obj.filePath)
        }),
      )
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

const makeApiErr = () => {
  const err = new Error('500 - "Internal Server Error"')

  err.name = 'StatusCodeError'

  return err
}

const makeErr = () => {
  const err = new Error('fail whale')

  err.stack = err.stack?.split('\n').slice(0, 3).join('\n') ?? ''

  return err as Error & {stack: string}
}

process.on('uncaughtException', (err) => {
  console.error(err)
  process.exit(1)
})

describe('visual error templates', () => {
  const errorType = (process.env.ERROR_TYPE || '*') as CypressErrorType

  // testVisualErrors('CANNOT_RECORD_NO_PROJECT_ID', {
  testVisualErrors(errorType, {
    LEGACY_CONFIG_ERROR_DURING_MIGRATION: () => {
      const err = makeErr()

      return {
        default: ['cypress/plugins/index.js', err],
      }
    },
    CANNOT_TRASH_ASSETS: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    CANNOT_REMOVE_OLD_BROWSER_PROFILES: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    VIDEO_RECORDING_FAILED: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    VIDEO_CAPTURE_FAILED: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    VIDEO_COMPRESSION_FAILED: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    CHROME_WEB_SECURITY_NOT_SUPPORTED: () => {
      return {
        default: ['firefox'],
      }
    },
    BROWSER_NOT_FOUND_BY_NAME: () => {
      return {
        default: ['invalid-browser', browsers.formatBrowsersToOptions(knownBrowsers)],
        canary: ['canary', browsers.formatBrowsersToOptions(knownBrowsers)],
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
    FIREFOX_CDP_FAILED_TO_CONNECT: () => {
      return {
        default: ['Retrying...'],
      }
    },
    TESTS_DID_NOT_START_FAILED: () => {
      return {
        default: [],
      }
    },
    CLOUD_CANCEL_SKIPPED_SPEC: () => {
      return {
        default: [],
      }
    },
    CLOUD_API_RESPONSE_FAILED_RETRYING: () => {
      return {
        default: [{
          tries: 3,
          delayMs: 5000,
          response: makeApiErr(),
        }],
        lastTry: [{
          tries: 1,
          delayMs: 5000,
          response: makeApiErr(),
        }],
      }
    },
    CLOUD_CANNOT_PROCEED_IN_PARALLEL: () => {
      return {
        default: [{
          flags: {
            ciBuildId: 'invalid',
            group: 'foo',
          },
          response: makeApiErr(),
        }],
      }
    },
    CLOUD_CANNOT_PROCEED_IN_SERIAL: () => {
      return {
        default: [{
          flags: {
            ciBuildId: 'invalid',
            group: 'foo',
          },
          response: makeApiErr(),
        }],
      }
    },
    CLOUD_UNKNOWN_INVALID_REQUEST: () => {
      return {
        default: [{
          flags: {
            ciBuildId: 'invalid',
            group: 'foo',
          },
          response: makeApiErr(),
        }],
      }
    },
    CLOUD_UNKNOWN_CREATE_RUN_WARNING: () => {
      return {
        default: [{
          props: {
            code: 'OUT_OF_TIME',
            name: 'OutOfTime',
            hadTime: 1000,
            spentTime: 999,
          },
          message: 'You are almost out of time',
        }],
      }
    },
    CLOUD_STALE_RUN: () => {
      return {
        default: [{
          runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
          tag: '123',
          group: 'foo',
          parallel: true,
        }],
      }
    },
    CLOUD_ALREADY_COMPLETE: () => {
      return {
        default: [{
          runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
          tag: '123',
          group: 'foo',
          parallel: true,
        }],
      }
    },
    CLOUD_PARALLEL_REQUIRED: () => {
      return {
        default: [{
          runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
          tag: '123',
          group: 'foo',
          parallel: true,
        }],
      }
    },
    CLOUD_PARALLEL_DISALLOWED: () => {
      return {
        default: [{
          runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
          tag: '123',
          group: 'foo',
          parallel: true,
        }],
      }
    },
    CLOUD_PARALLEL_GROUP_PARAMS_MISMATCH: () => {
      return {
        default: [
          {
            group: 'foo',
            runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
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
            payload: {},
          },
        ],
        differentParams: [
          {
            group: 'foo',
            runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
            ciBuildId: 'test-ciBuildId-123',
            parameters: {
              osName: 'darwin',
              osVersion: 'v1',
              browserName: 'Electron',
              browserVersion: '59.1.2.3',
              specs: [
                'cypress/integration/app_spec.js',
                'cypress/integration/foo_spec.js',
                'cypress/integration/bar_spec.js',
              ],
            },
            payload: {
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
          },
        ],
      }
    },
    CLOUD_RUN_GROUP_NAME_NOT_UNIQUE: () => {
      return {
        default: [{
          runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
          tag: '123',
          group: 'foo',
          parallel: true,
        }],
      }
    },
    CLOUD_AUTO_CANCEL_NOT_AVAILABLE_IN_PLAN: () => {
      return {
        default: [{ link: 'https://on.cypress.io/set-up-billing' }],
      }
    },
    CLOUD_AUTO_CANCEL_MISMATCH: () => {
      return {
        default: [{
          runUrl: 'https://cloud.cypress.io/project/abcd/runs/1',
          tag: '123',
          group: 'foo',
          parallel: true,
          autoCancelAfterFailures: 3,
        }],
      }
    },
    DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS: () => {
      return {
        default: [],
      }
    },
    DUPLICATE_TASK_KEY: () => {
      const tasks = ['foo', 'bar', 'baz']

      return {
        default: [tasks],
      }
    },
    INDETERMINATE_CI_BUILD_ID: () => {
      return {
        default: [{
          group: 'foo',
          parallel: 'false',
        },
        ciProvider.detectableCiBuildIdProviders()],
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
        default: ['project-id-123'],
      }
    },
    CLOUD_INVALID_RUN_REQUEST: () => {
      return {
        default: [{
          message: 'Request Validation Error',
          errors: [
            'data.commit has additional properties',
            'data.ci.buildNumber is required',
          ],
          object: {
            foo: 'foo',
            bar: 'bar',
            baz: 'baz',
          },
        }],
      }
    },
    RECORDING_FROM_FORK_PR: () => {
      return {
        default: [],
      }
    },
    CLOUD_CANNOT_UPLOAD_ARTIFACTS: () => {
      const err = makeApiErr()

      return {
        default: [err],
      }
    },
    CLOUD_CANNOT_CONFIRM_ARTIFACTS: () => {
      return {
        default: [makeErr()],
      }
    },
    CLOUD_CANNOT_CREATE_RUN_OR_INSTANCE: () => {
      const err = makeApiErr()

      return {
        default: [err],
      }
    },
    CLOUD_PROTOCOL_CANNOT_UPLOAD_ARTIFACT: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    CLOUD_PROTOCOL_INITIALIZATION_FAILURE: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    CLOUD_PROTOCOL_CAPTURE_FAILURE: () => {
      const err = makeErr()

      return {
        default: [err],
      }
    },
    CLOUD_PROTOCOL_UPLOAD_HTTP_FAILURE: () => {
      // @ts-expect-error
      const err: Error & { status: number, statusText: string, url: string, message: string, responseBody: string } = makeErr()

      err.status = 500
      err.statusText = 'Internal Server Error'
      err.url = 'https://some/url'
      err.responseBody = '{ status: 500, reason: \'unknown\'}'

      return {
        default: [err],
      }
    },
    CLOUD_PROTOCOL_UPLOAD_NETWORK_FAILURE: () => {
      // @ts-expect-error
      const err: Error & { url: string } = makeErr()

      err.url = 'https://some/url'

      return {
        default: [err],
      }
    },
    CLOUD_PROTOCOL_UPLOAD_STREAM_STALL_FAILURE: () => {
      // @ts-expect-error
      const err: Error & { chunkSizeKB: number, maxActivityDwellTime: number } = new Error('stream stall')

      err.chunkSizeKB = 64
      err.maxActivityDwellTime = 5000

      return {
        default: [err],
      }
    },
    CLOUD_PROTOCOL_UPLOAD_AGGREGATE_ERROR: () => {
      // @ts-expect-error
      const aggregateError: Error & { errors: any[] } = makeErr()
      // @ts-expect-error
      const aggregateErrorWithSystemError: Error & { errors: any[] } = makeErr()

      const errOne = makeErr()
      const errTwo = makeErr()
      const errThree = makeErr()

      aggregateError.errors = [errOne, errTwo, errThree]

      // @ts-expect-error
      const errSystemErr: Error & { kind: string, url: string } = new Error('http://some/url: ECONNRESET')

      errSystemErr.kind = 'SystemError'
      errSystemErr.url = 'http://some/url'
      aggregateErrorWithSystemError.errors = [errSystemErr, errTwo, errThree]

      return {
        default: [aggregateError],
        withSystemError: [aggregateErrorWithSystemError],
      }
    },
    CLOUD_PROTOCOL_UPLOAD_UNKNOWN_ERROR: () => {
      const error = makeErr()

      return {
        default: [error],
      }
    },
    CLOUD_RECORD_KEY_NOT_VALID: () => {
      return {
        default: ['record-key-123', 'project-id-123'],
      }
    },
    CLOUD_PROJECT_NOT_FOUND: () => {
      return {
        default: ['project-id-123', '/path/to/cypress.json'],
      }
    },
    NO_PROJECT_ID: () => {
      return {
        default: ['/path/to/project/cypress.json'],
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
        default: ['/path/to/write/file.ts', makeErr()],
      }
    },
    NO_SPECS_FOUND: () => {
      return {
        default: ['/path/to/project/root', '**_spec.js'],
        pathCommonPattern: ['/path/to/project/root', ['../**_spec.js', '../**/*.cy.*']],
        pathNoCommonPattern: ['/path/to/project/root', ['/foo/*_spec.js']],
        arrPattern: ['/path/to/project/root', ['**_spec.js', '**/*.cy.*']],
        noPattern: ['/path/to/project/root'],
      }
    },
    RENDERER_CRASHED: () => {
      return {
        default: ['Electron'],
      }
    },
    BROWSER_CRASHED: () => {
      return {
        default: ['Chrome', 'code', 'signal'],
      }
    },
    AUTOMATION_SERVER_DISCONNECTED: () => {
      return {
        default: [],
      }
    },
    SUPPORT_FILE_NOT_FOUND: () => {
      return {
        default: ['/path/to/supportFile'],
      }
    },
    DEFAULT_SUPPORT_FILE_NOT_FOUND: () => {
      return {
        default: ['/path/to/supportFile/**/*.{js,jsx,ts,tsx}'],
      }
    },
    CONFIG_FILE_REQUIRE_ERROR: () => {
      const err = makeErr()

      return {
        default: ['/path/to/cypress.config.js', err],
      }
    },
    SETUP_NODE_EVENTS_IS_NOT_FUNCTION: () => {
      return {
        default: ['/path/to/cypress.config.js', 'e2e', { some: 'object' }],
        string: ['/path/to/cypress.config.js', 'component', 'some string'],
        array: ['/path/to/cypress.config.js', 'component', ['some', 'array']],
      }
    },
    CONFIG_FILE_SETUP_NODE_EVENTS_ERROR: () => {
      return {
        default: ['/path/to/cypress.config.js', 'e2e', makeErr()],
        component: ['/path/to/cypress.config.js', 'component', makeErr()],
      }
    },
    CONFIG_FILE_UNEXPECTED_ERROR: () => {
      const err = makeErr()

      return {
        default: ['/path/to/cypress.config.js', err],
      }
    },
    SETUP_NODE_EVENTS_INVALID_EVENT_NAME_ERROR: () => {
      const err = makeErr()

      return {
        default: [
          '/path/to/cypress.config.js',
          'invalid:event',
          ['foo', 'bar', 'baz'],
          err,
        ],
      }
    },
    BUNDLE_ERROR: () => {
      const err = makeErr()

      return {
        default: ['/path/to/file', err.message],
      }
    },
    CONFIG_VALIDATION_ERROR: () => {
      return {
        default: ['configFile', 'cypress.json', {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: false,
        }],
        list: ['configFile', 'cypress.json', {
          key: 'displayName',
          type: 'a non-empty string',
          value: { name: 'chrome', version: '1.2.3', displayName: null },
          list: 'browsers',
        }],
        invalidString: ['configFile', 'cypress.json', {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: '1234',
        }],
        invalidObject: ['configFile', 'cypress.json', {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: { foo: 'bar' },
        }],
        invalidArray: ['configFile', 'cypress.json', {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: [1, 2, 3],
        }],
        noFileType: [null, null, {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: false,
        }],
      }
    },
    CONFIG_VALIDATION_MSG_ERROR: () => {
      return {
        default: ['configFile', 'cypress.json', '`something` was not right'],
        noFileType: [null, null, '`something` was not right'],
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
        default: [{
          attempt: 1,
          baseUrl: 'http://localhost:3000',
          remaining: 60,
          delay: 500,
        }],
        retrying: [{
          attempt: 2,
          baseUrl: 'http://localhost:3000',
          remaining: 60,
          delay: 500,
        }],
      }
    },
    INVALID_REPORTER_NAME: () => {
      return {
        default: [{
          name: 'missing-reporter-name',
          paths: ['/path/to/reporter', '/path/reporter'],
          error: makeErr(),
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
          '/path/to/project/root',
          ['cypress.config.js', 'cypress.config.ts', 'cypress.config.mjs'],
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
          link: 'https://cloud.cypress.io/project/abcd',
          limit: 500,
          usedTestsMessage: 'test',
        }],
      }
    },
    FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS: () => {
      return {
        default: [{
          link: 'https://cloud.cypress.io/project/abcd',
          limit: 500,
          usedTestsMessage: 'test',
          gracePeriodMessage: 'the grace period ends',
        }],
      }
    },
    PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS: () => {
      return {
        default: [{
          link: 'https://on.cypress.io/set-up-billing',
          limit: 25000,
          usedTestsMessage: 'private test',
        }],
      }
    },
    FREE_PLAN_EXCEEDS_MONTHLY_TESTS: () => {
      return {
        default: [{
          link: 'https://on.cypress.io/set-up-billing',
          limit: 500,
          usedTestsMessage: 'test',
        }],
      }
    },
    FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS: () => {
      return {
        default: [{
          link: 'https://on.cypress.io/set-up-billing',
          limit: 500,
          usedTestsMessage: 'test',
          gracePeriodMessage: 'Feb 1, 2022',
        }],
      }
    },
    PLAN_EXCEEDS_MONTHLY_TESTS: () => {
      return {
        default: [{
          link: 'https://on.cypress.io/set-up-billing',
          planType: 'Sprout',
          limit: 25000,
          usedTestsMessage: 'test',
        }],
      }
    },
    FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE: () => {
      return {
        default: [{
          link: 'https://on.cypress.io/set-up-billing',
          gracePeriodMessage: 'Feb 1, 2022',
        }],
      }
    },
    PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN: () => {
      return {
        default: [{ link: 'https://on.cypress.io/set-up-billing' }],
      }
    },
    PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED: () => {
      return {
        default: [{
          link: 'https://on.cypress.io/set-up-billing',
          gracePeriodMessage: 'Feb 1, 2022',
        }],
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
    INVALID_CYPRESS_INTERNAL_ENV: () => {
      return {
        default: ['foo'],
      }
    },
    CDP_VERSION_TOO_OLD: () => {
      return {
        default: ['1.3', { major: 1, minor: 2 }],
        older: ['1.3', { major: 0, minor: 0 }],
      }
    },
    CDP_COULD_NOT_CONNECT: () => {
      return {
        default: ['chrome', 2345, makeErr()],
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
        default: [1, 'chrome', 62],
      }
    },
    BROWSER_PROCESS_CLOSED_UNEXPECTEDLY: () => {
      return {
        default: ['chrome'],
      }
    },
    BROWSER_PAGE_CLOSED_UNEXPECTEDLY: () => {
      return {
        default: ['chrome'],
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
    FIREFOX_GECKODRIVER_FAILURE: () => {
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
    EXPERIMENTAL_JIT_COMPILE_REMOVED: () => {
      return {
        default: [],
      }
    },
    EXPERIMENTAL_COMPONENT_TESTING_REMOVED: () => {
      return {
        default: [{ configFile: '/path/to/cypress.config.js' }],
      }
    },
    EXPERIMENTAL_SESSION_SUPPORT_REMOVED: () => {
      return {
        default: [],
      }
    },
    EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED: () => {
      return {
        default: [],
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
    EXPERIMENTAL_STUDIO_REMOVED: () => {
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
    CONFIG_FILE_MIGRATION_NEEDED: () => {
      return {
        default: ['/path/to/projectRoot'],
      }
    },
    LEGACY_CONFIG_FILE: () => {
      return {
        default: ['cypress.json', '/path/to/projectRoot'],
      }
    },
    SETUP_NODE_EVENTS_DO_NOT_SUPPORT_DEV_SERVER: () => {
      return {
        default: ['/path/to/project/cypress.config.js'],
      }
    },
    CONFIG_FILE_INVALID_DEV_START_EVENT: () => {
      return {
        default: ['/path/to/plugins/file.js'],
      }
    },
    CONFIG_FILE_DEV_SERVER_INVALID_RETURN: () => {
      return {
        default: [{}],
      }
    },
    PLUGINS_RUN_EVENT_ERROR: () => {
      return {
        default: ['before:spec', makeErr()],
      }
    },
    INVALID_CONFIG_OPTION: () => {
      return {
        default: [['foo']],
        plural: [['foo', 'bar']],
      }
    },
    UNSUPPORTED_BROWSER_VERSION: () => {
      return {
        default: [`Cypress does not support running chrome version 64. To use chrome with Cypress, install a version of chrome newer than or equal to 64.`],
      }
    },
    MULTIPLE_SUPPORT_FILES_FOUND: () => {
      return {
        default: ['spec.{ts,js}', ['support.ts', 'support.js']],
      }
    },
    PLUGINS_FILE_CONFIG_OPTION_REMOVED: () => {
      return {
        default: [{ name: 'pluginsFile', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    VIDEO_UPLOAD_ON_PASSES_REMOVED: () => {
      return {
        default: [{ name: 'videoUploadOnPasses', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    CONFIG_FILE_INVALID_ROOT_CONFIG: () => {
      return {
        default: [{ name: 'specPattern', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    CONFIG_FILE_INVALID_ROOT_CONFIG_E2E: () => {
      return {
        default: [{ name: 'baseUrl', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    CONFIG_FILE_INVALID_ROOT_CONFIG_COMPONENT: () => {
      return {
        default: [{ name: 'indexHtmlFile', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT: () => {
      return {
        default: [{ name: 'baseUrl', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_E2E: () => {
      return {
        default: [{ name: 'indexHtmlFile', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    JIT_COMPONENT_TESTING: () => {
      return {
        default: [],
      }
    },
    CONFIG_FILE_DEV_SERVER_IS_NOT_VALID: () => {
      return {
        default: ['/path/to/config.ts', {}],
      }
    },
    UNEXPECTED_INTERNAL_ERROR: () => {
      return {
        default: [makeErr()],
      }
    },
    UNEXPECTED_MUTATION_ERROR: () => {
      return {
        default: ['wizardUpdate', {}, makeErr()],
      }
    },
    CLOUD_GRAPHQL_ERROR: () => {
      return {
        default: [makeErr()],
      }
    },
    MIGRATION_ALREADY_OCURRED: () => {
      return {
        default: ['custom.config.js', 'custom.json'],
      }
    },
    TEST_FILES_RENAMED: () => {
      return {
        default: [{ name: 'testFiles', newName: 'specPattern', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    COMPONENT_FOLDER_REMOVED: () => {
      return {
        default: [{ name: 'componentFolder', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    INTEGRATION_FOLDER_REMOVED: () => {
      return {
        default: [{ name: 'integrationFolder', configFile: '/path/to/cypress.config.js.ts' }],
      }
    },
    MIGRATION_MISMATCHED_CYPRESS_VERSIONS: () => {
      return {
        default: ['9.6.0', '10.0.0'],
      }
    },
    MIGRATION_CYPRESS_NOT_FOUND: () => {
      return {
        default: [],
      }
    },
    DEV_SERVER_CONFIG_FILE_NOT_FOUND: () => {
      return {
        default: ['vite', '/dev/project', ['vite.config.js', 'vite.config.ts']],
      }
    },
    TESTING_TYPE_NOT_CONFIGURED: () => {
      return {
        default: ['component'],
      }
    },

    COMPONENT_TESTING_MISMATCHED_DEPENDENCIES: () => {
      return {
        default: [
          [
            {
              dependency: {
                type: 'vite',
                name: 'Vite',
                package: 'vite',
                installer: 'vite',
                description: 'Vite is dev server that serves your source files over native ES modules',
                minVersion: '^=2.0.0 || ^=3.0.0 || ^=4.0.0 || ^=5.0.0',
              },
              satisfied: false,
              detectedVersion: '1.0.0',
              loc: null,
            },
          ],
        ],
      }
    },

    EXPERIMENTAL_SINGLE_TAB_RUN_MODE: () => {
      return {
        default: [],
      }
    },

    EXPERIMENTAL_STUDIO_E2E_ONLY: () => {
      return {
        default: [],
      }
    },

    EXPERIMENTAL_RUN_ALL_SPECS_E2E_ONLY: () => {
      return {
        default: [],
      }
    },

    BROWSER_UNSUPPORTED_LAUNCH_OPTION: () => {
      return {
        default: ['electron', ['env']],
      }
    },

    EXPERIMENTAL_ORIGIN_DEPENDENCIES_E2E_ONLY: () => {
      return {
        default: [],
      }
    },

    EXPERIMENTAL_USE_DEFAULT_DOCUMENT_DOMAIN_E2E_ONLY: () => {
      return {
        default: [],
      }
    },

    PROXY_ENCOUNTERED_INVALID_HEADER_NAME: () => {
      const err = makeErr()

      return {
        default: [{ invalidHeaderName: 'Value' }, 'GET', 'http://localhost:8080', err],
      }
    },

    PROXY_ENCOUNTERED_INVALID_HEADER_VALUE: () => {
      const err = makeErr()

      return {
        default: [{ invalidHeaderValue: 'Value' }, 'GET', 'http://localhost:8080', err],
      }
    },
  })
})
