import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'
import * as errors from '../src'
import os from 'os'

// Mock data for template params - we only assert template rendering, not real browser/CI data
const MOCK_FOUND_BROWSERS = ['Chrome 120', 'Firefox 121', 'Edge 119']
const MOCK_CI_BUILD_ID_PROVIDERS = ['GitHub Actions', 'CircleCI', 'Jenkins']

interface ErrorGenerator<T extends CypressErrorType> {
  default: Parameters<typeof errors.AllCypressErrors[T]>
  [key: string]: Parameters<typeof errors.AllCypressErrors[T]>
}

type CypressErrorType = keyof typeof errors.AllCypressErrors

const cypressRootPath = path.join(__dirname, '..', '..', '..')
const lineAndColNumsRe = /:\d+:\d+/

const sanitize = (str: string) => {
  return str
  .split(lineAndColNumsRe).join('')
  .split(cypressRootPath).join('cypress')
  .split(os.tmpdir()).join('/os/tmpdir')
}

const makeApiErr = () => {
  const err = new Error('500 - "Internal Server Error"')

  err.name = 'StatusCodeError'

  return err
}

const makeErr = () => {
  const err = new Error('fail whale')

  err.stack = err.stack?.split('\n').slice(0, 3).join('\n') ?? ''

  return err as Error & { stack: string }
}

describe('visual error templates', () => {
  const errorType = (process.env.ERROR_TYPE || '*') as CypressErrorType

  let previousChalkLevel: 0 | 1 | 2 | 3
  let getConsoleLogOutput: () => string

  beforeEach(async () => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()

    // turns chalk on
    previousChalkLevel = chalk.level
    chalk.level = 3

    const logs: string[] = []

    // spy on console.log and mock the output so we can snapshot the logs with chalk turned on
    vi.spyOn(console, 'log').mockImplementation((args) => {
      logs.push(args)
    })

    getConsoleLogOutput = () => {
      const sanitizedLogs = _
      .chain(logs)
      .map(sanitize)
      .join('\n')
      .value()

      return sanitizedLogs
    }
  })

  afterEach(() => {
    chalk.level = previousChalkLevel
  })

  const testVisualError = <K extends CypressErrorType> (errorGeneratorFn: () => ErrorGenerator<K>, errorType: K) => {
    const variants = errorGeneratorFn()

    expect(variants).to.be.instanceOf(Object)

    for (const [key, arr] of Object.entries(variants)) {
      const filename = key === 'default' ? errorType : `${errorType} - ${key}`

      it(`${errorType} - ${key}`, async () => {
        const err = errors.get(errorType, ...arr)

        if (!errors.isCypressErr(err)) {
          throw new Error(`Expected Cypress Error`)
        }

        errors.log(err)

        const consoleLogOutput = getConsoleLogOutput()

        await expect(consoleLogOutput).toMatchFileSnapshot(`./__snapshots__/${filename}.ansi`)
      })
    }
  }

  const testVisualErrors = (whichError: CypressErrorType | '*', errorsToTest: { [K in CypressErrorType]: () => ErrorGenerator<K> }) => {
    // if we aren't testing all the errors
    if (whichError !== '*') {
      // then just test this individual error
      return testVisualError(errorsToTest[whichError], whichError)
    }

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

      expect(missingErrorTypes, 'you are missing tests around the following error types').toHaveLength(0)
      expect(excessErrorTypes, 'you have added excessive tests for errors which do not exist').toHaveLength(0)
    })
  }

  testVisualErrors(errorType, {
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
    CHROME_137_LOAD_EXTENSION_NOT_SUPPORTED: () => {
      return {
        default: [],
      }
    },
    CHROME_WEB_SECURITY_NOT_SUPPORTED: () => {
      return {
        default: ['firefox'],
      }
    },
    BROWSER_NOT_FOUND_BY_NAME: () => {
      return {
        default: ['invalid-browser', MOCK_FOUND_BROWSERS],
        canary: ['canary', MOCK_FOUND_BROWSERS],
      }
    },
    BROWSER_NOT_FOUND_BY_PATH: () => {
      const err = makeErr()

      return {
        default: ['/path/does/not/exist', err.message],
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
    CANNOT_ENABLE_FEATURE_WITH_NO_TESTS: () => {
      return {
        default: [{ feature: 'record' }],
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
          delay: '5 seconds',
          response: makeApiErr(),
        }],
        lastTry: [{
          tries: 1,
          delay: '5 seconds',
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
    CLOUD_CANNOT_PROCEED_IN_PARALLEL_NETWORK: () => {
      return {
        default: [{
          flags: {
            ciBuildId: 'invalid',
            group: 'foo',
          },
          response: makeErr(),
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
    CLOUD_CANNOT_PROCEED_IN_SERIAL_NETWORK: () => {
      return {
        default: [{
          flags: {
            ciBuildId: 'invalid',
            group: 'foo',
          },
          response: makeErr(),
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
        MOCK_CI_BUILD_ID_PROVIDERS],
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
        default: ['/path/to/cypress.config.js'],
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
      const err: Error & { chunkSizeBytes: number, maxActivityDwellTime: number } = new Error('stream stall')

      err.chunkSizeBytes = 65536
      err.maxActivityDwellTime = 10000

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
        default: ['project-id-123', '/path/to/cypress.config.js'],
      }
    },
    NO_PROJECT_ID: () => {
      return {
        default: ['/path/to/project/cypress.config.js'],
      }
    },
    NO_PROJECT_FOUND_AT_PROJECT_ROOT: () => {
      return {
        default: ['/path/to/project'],
      }
    },
    PORT_IN_USE_SHORT: () => {
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
        default: ['configFile', 'cypress.config.js', {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: false,
        }],
        list: ['configFile', 'cypress.config.js', {
          key: 'displayName',
          type: 'a non-empty string',
          value: { name: 'chrome', version: '1.2.3', displayName: null },
          list: 'browsers',
        }],
        invalidString: ['configFile', 'cypress.config.js', {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: '1234',
        }],
        invalidObject: ['configFile', 'cypress.config.js', {
          key: 'defaultCommandTimeout',
          type: 'a number',
          value: { foo: 'bar' },
        }],
        invalidArray: ['configFile', 'cypress.config.js', {
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
        default: ['configFile', 'cypress.config.js', '`something` was not right'],
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
        default: ['cypress.config.js', '/path/to/project/root'],
      }
    },
    INVOKED_BINARY_OUTSIDE_NPM_MODULE: () => {
      return {
        default: [],
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
    FOLDER_NOT_WRITABLE: () => {
      return {
        default: ['/path/to/folder'],
      }
    },
    EXPERIMENTAL_JIT_COMPILE_REMOVED: () => {
      return {
        default: [],
      }
    },
    EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED: () => {
      return {
        default: [],
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

    EXPERIMENTAL_STUDIO_REMOVED: () => {
      return {
        default: [],
      }
    },

    EXPERIMENTAL_PROMPT_COMMAND_REMOVED: () => {
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

    EXPERIMENTAL_SKIP_DOMAIN_INJECTION_REMOVED: () => {
      return {
        default: [],
      }
    },

    INJECT_DOCUMENT_DOMAIN_DEPRECATION: () => {
      return {
        default: [],
      }
    },

    INJECT_DOCUMENT_DOMAIN_E2E_ONLY: () => {
      return {
        default: [],
      }
    },
    SYNCHRONOUS_XHR_REQUEST_NOT_INTERCEPTED: () => {
      return {
        default: ['http://localhost:8080'],
      }
    },
    SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_APPLIED: () => {
      return {
        default: ['http://localhost:8080'],
      }
    },
    SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_SET: () => {
      return {
        default: ['http://localhost:8080'],
      }
    },
    CYPRESS_ENV_DEPRECATION: () => {
      return {
        default: [],
      }
    },
  })
})
