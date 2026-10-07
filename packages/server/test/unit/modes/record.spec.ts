import _ from 'lodash'
import Debug from 'debug'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import * as errors from '../../../lib/errors'
import api from '../../../lib/cloud/api'
import exception from '../../../lib/cloud/exception'
import commitInfo from '../../../lib/util/commit-info'
import recordMode from '../../../lib/modes/record'
import * as ciProvider from '../../../lib/util/ci_provider'

const debug = Debug('test')
const initialEnv = _.clone(process.env)

// sinon's calledWith matches leading arguments only
const callsStartingWith = (mock: Mock, ...args: unknown[]) => {
  return mock.mock.calls.filter((call) => _.isEqual(call.slice(0, args.length), args))
}

// NOTE: the majority of the logic of record_spec is
// tested as an e2e/record_spec
describe('lib/modes/record', () => {
  beforeEach(() => {
    vi.spyOn(api, 'sendPreflight').mockImplementation(async () => {
      api.setPreflightResult({ encrypt: false })
    })
  })

  afterEach(() => {
    api.resetPreflightResult({ encrypt: false })
    vi.restoreAllMocks()
  })

  // QUESTION: why are these tests here when
  // this is a module... ?
  describe('.getCommitFromGitOrCi', () => {
    const gitCommit = {
      branch: null,
    }

    beforeEach(() => {
      delete process.env.CIRCLE_BRANCH
      delete process.env.TRAVIS_BRANCH
      delete process.env.BUILDKITE_BRANCH
      delete process.env.CI_BRANCH
      delete process.env.CIRCLECI
      delete process.env.TRAVIS
      delete process.env.BUILDKITE
      delete process.env.CI_NAME
      delete process.env.APPVEYOR
      delete process.env.APPVEYOR_REPO_BRANCH
    })

    afterEach(() => {
      process.env = initialEnv
    })

    it('gets branch from process.env.CIRCLE_BRANCH', () => {
      process.env.CIRCLECI = '1'
      process.env.CIRCLE_BRANCH = 'bem/circle'
      process.env.TRAVIS_BRANCH = 'bem/travis'
      process.env.CI_BRANCH = 'bem/ci'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).toBe('bem/circle')
    })

    it('gets branch from process.env.TRAVIS_BRANCH', () => {
      process.env.TRAVIS = '1'
      process.env.TRAVIS_BRANCH = 'bem/travis'
      process.env.CI_BRANCH = 'bem/ci'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).toBe('bem/travis')
    })

    it('gets branch from process.env.BUILDKITE_BRANCH', () => {
      process.env.BUILDKITE = '1'
      process.env.BUILDKITE_BRANCH = 'bem/buildkite'
      process.env.CI_BRANCH = 'bem/ci'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).toBe('bem/buildkite')
    })

    it('gets branch from process.env.APPVEYOR_REPO_BRANCH for AppVeyor', () => {
      process.env.APPVEYOR = '1'
      process.env.APPVEYOR_REPO_BRANCH = 'bem/app'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).toBe('bem/app')
    })

    it('gets branch from git', () => {
      // this is tested inside @cypress/commit-info
    })
  })

  describe('.createRunAndRecordSpecs', () => {
    describe('commit information from commitInfo', () => {
      const commitData = {
        branch: 'my-branch-221',
        message: 'best commit ever',
        email: 'user@company.com',
        author: 'Agent Smith',
        sha: '0123456',
        timestamp: null,
        remote: 'remote repo',
      }

      beforeEach(() => {
        // Stub commitInfo to return test data
        // Note: The actual env var fallback/override behavior is tested in commit-info_spec.ts
        // This test verifies that record module correctly uses values from commitInfo.commitInfo()
        vi.spyOn(commitInfo, 'commitInfo').mockResolvedValue(commitData)
      })

      afterEach(() => {
        vi.restoreAllMocks()
      })

      it('calls api.createRun with commit information from commitInfo', () => {
        const createRun = vi.spyOn(api, 'createRun').mockResolvedValue(undefined)
        const runAllSpecs = vi.fn()

        return recordMode.createRunAndRecordSpecs({
          key: 'foo',
          sys: {},
          browser: {},
          runAllSpecs,
        })
        .then(() => {
          expect(runAllSpecs).toHaveBeenCalledWith({ parallel: false })
          expect(createRun).toHaveBeenCalledTimes(1)
          expect(createRun.mock.calls[0]).toHaveLength(1)
          const { commit } = createRun.mock.calls[0][0]

          debug('git is %o', commit)

          expect(commit).toEqual({
            sha: commitData.sha,
            branch: commitData.branch,
            authorName: commitData.author,
            authorEmail: commitData.email,
            message: commitData.message,
            remoteOrigin: commitData.remote,
            defaultBranch: null,
          })
        })
      })
    })

    describe('with CI info', () => {
      const specs = [
        { relative: 'path/to/spec/a' },
        { relative: 'path/to/spec/b' },
      ]

      let commitDefaults

      beforeEach(() => {
        vi.spyOn(ciProvider, 'provider').mockReturnValue('circle')
        vi.spyOn(ciProvider, 'ciParams').mockReturnValue({ foo: 'bar' })

        commitDefaults = {
          branch: 'master',
          author: 'brian',
          email: 'brian@cypress.io',
          message: 'such hax',
          sha: 'sha-123',
          remote: 'https://github.com/foo/bar.git',
        }

        vi.spyOn(commitInfo, 'commitInfo').mockResolvedValue(commitDefaults)
        vi.spyOn(ciProvider, 'commitDefaults').mockReturnValue({
          sha: commitDefaults.sha,
          branch: commitDefaults.branch,
          authorName: commitDefaults.author,
          authorEmail: commitDefaults.email,
          message: commitDefaults.message,
          remoteOrigin: commitDefaults.remote,
        })

        vi.spyOn(api, 'createRun').mockResolvedValue({
          runId: 'run-id',
        })

        vi.spyOn(api, 'createInstance').mockResolvedValue({
          instanceId: 'instance-id',
        })
      })

      it('calls api.createRun with the right args and updates the current run id', async () => {
        const key = 'recordKey'
        const projectId = 'pId123'
        const specPattern = ['spec/pattern1', 'spec/pattern2']
        const projectRoot = 'project/root'
        const ciBuildId = 'ciId123'
        const parallel = null
        const group = null
        const runAllSpecs = vi.fn()
        const sys = {
          osCpus: 1,
          osName: 2,
          osMemory: 3,
          osVersion: 4,
        }
        const browser = {
          displayName: 'chrome',
          version: '59',
          family: 'chromium',
        }
        const tag = 'nightly,develop'
        const testingType = 'e2e'
        const autoCancelAfterFailures = 4
        const project = {
          setOnTestsReceived: vi.fn(),
        }
        const ctx = {
          actions: {
            currentRecording: {
              startRun: vi.fn(),
              startInstance: vi.fn(),
            },
          },
        }

        await recordMode.createRunAndRecordSpecs({
          key,
          sys,
          specs,
          group,
          browser,
          parallel,
          ciBuildId,
          projectId,
          projectRoot,
          specPattern,
          runAllSpecs,
          tag,
          testingType,
          autoCancelAfterFailures,
          project,
          ctx,
        })

        expect(ctx.actions.currentRecording.startRun).toHaveBeenCalledWith('run-id')
        expect(commitInfo.commitInfo).toHaveBeenCalledWith(projectRoot)

        expect(api.createRun).toHaveBeenCalledWith({
          projectRoot,
          group,
          parallel,
          projectId,
          ciBuildId,
          recordKey: key,
          testingType,
          specPattern: 'spec/pattern1,spec/pattern2',
          specs: ['path/to/spec/a', 'path/to/spec/b'],
          platform: {
            osCpus: 1,
            osName: 2,
            osMemory: 3,
            osVersion: 4,
            browserName: 'chrome',
            browserVersion: '59',
            browserFamily: 'chromium',
          },
          ci: {
            params: {
              foo: 'bar',
            },
            provider: 'circle',
          },
          commit: {
            authorEmail: 'brian@cypress.io',
            authorName: 'brian',
            branch: 'master',
            message: 'such hax',
            remoteOrigin: 'https://github.com/foo/bar.git',
            sha: 'sha-123',
          },
          tags: ['nightly', 'develop'],
          autoCancelAfterFailures: 4,
          project,
        })

        expect(runAllSpecs).toHaveBeenCalled()

        const beforeSpecRun = runAllSpecs.mock.calls[0][0].beforeSpecRun

        await beforeSpecRun()

        expect(api.createInstance).toHaveBeenCalledWith('run-id', expect.objectContaining({
          platform: expect.objectContaining({
            browserFamily: 'chromium',
            browserName: 'chrome',
            browserVersion: '59',
          }),
        }))

        expect(ctx.actions.currentRecording.startInstance).toHaveBeenCalledWith('instance-id')
      })

      it('passes browser.family as platform.browserFamily for non-chromium browsers', async () => {
        const runAllSpecs = vi.fn()
        const sys = { osCpus: 1, osName: 'linux', osMemory: 8, osVersion: '1' }
        const browser = {
          displayName: 'firefox',
          version: '120',
          family: 'firefox',
        }
        const project = { setOnTestsReceived: vi.fn() }
        const ctx = {
          actions: {
            currentRecording: { startRun: vi.fn(), startInstance: vi.fn() },
          },
        }

        await recordMode.createRunAndRecordSpecs({
          key: 'k',
          sys,
          specs,
          browser,
          projectRoot: 'root',
          specPattern: ['a'],
          runAllSpecs,
          testingType: 'e2e',
          project,
          ctx,
        })

        expect(api.createRun).toHaveBeenCalledWith(expect.objectContaining({
          platform: expect.objectContaining({
            browserFamily: 'firefox',
            browserName: 'firefox',
            browserVersion: '120',
          }),
        }))
      })
    })
  })

  describe('.updateInstanceStdout', () => {
    let options

    beforeEach(() => {
      vi.spyOn(api, 'updateInstanceStdout').mockImplementation(() => undefined as any)

      options = {
        runId: 'run-id-123',
        instanceId: 'id-123',
        captured: {
          toString () {
            return 'foobarbaz\n'
          },
        },
      }
    })

    it('calls api.updateInstanceStdout', () => {
      vi.mocked(api.updateInstanceStdout).mockResolvedValue(undefined)

      return recordMode.updateInstanceStdout(options)
      .then(() => {
        expect(api.updateInstanceStdout).toHaveBeenCalledWith({
          runId: 'run-id-123',
          instanceId: 'id-123',
          stdout: 'foobarbaz\n',
        })
      })
    })

    it('does not create exception when statusCode is 503', () => {
      const err = new Error('foo')

      err.statusCode = 503

      vi.mocked(api.updateInstanceStdout).mockRejectedValue(err)
      vi.spyOn(exception, 'create')

      const options = {
        instanceId: 'id-123',
        captured: { toString () {
          return 'foobarbaz\n'
        } },
      }

      return recordMode.updateInstanceStdout(options)
      .then(() => {
        expect(exception.create).not.toHaveBeenCalled()
      })
    })
  })

  describe('.createInstance', () => {
    let options

    beforeEach(() => {
      vi.spyOn(api, 'createInstance').mockImplementation(() => undefined as any)

      options = {
        runId: 'run-123',
        groupId: 'group-123',
        machineId: 'machine-123',
        platform: {},
        spec: { relative: 'cypress/e2e/app_spec.cy.js' },
      }
    })

    it('calls api.createInstance', () => {
      vi.mocked(api.createInstance).mockResolvedValue(undefined)

      return recordMode.createInstance(options)
      .then(() => {
        expect(api.createInstance).toHaveBeenCalledWith('run-123', {
          groupId: 'group-123',
          machineId: 'machine-123',
          platform: {},
          spec: 'cypress/e2e/app_spec.cy.js',
        })
      })
    })

    it('errors when statusCode is 503', async () => {
      const err = new Error('foo')

      err.statusCode = 503

      vi.mocked(api.createInstance).mockRejectedValue(err)

      vi.spyOn(errors, 'get')

      await expect(recordMode.createInstance({
        runId: 'run-123',
        groupId: 'group-123',
        machineId: 'machine-123',
        platform: {},
        spec: { relative: 'cypress/e2e/app_spec.cy.js' },
      })).rejects.toThrow()

      expect(callsStartingWith(vi.mocked(errors.get), 'CLOUD_CANNOT_PROCEED_IN_SERIAL')).not.toHaveLength(0)
    })
  })

  describe('.createRun', () => {
    let options

    beforeEach(() => {
      vi.spyOn(api, 'createRun').mockImplementation(() => undefined as any)
      vi.spyOn(ciProvider, 'ciParams').mockReturnValue({})
      vi.spyOn(ciProvider, 'provider').mockReturnValue('')
      vi.spyOn(ciProvider, 'commitDefaults').mockReturnValue({})

      options = {
        git: {},
        recordKey: '1',
      }
    })

    // https://github.com/cypress-io/cypress/issues/14571
    it('handles non-string key', async () => {
      const err = new Error('Invalid Record Key')

      err.statusCode = 401

      vi.mocked(api.createRun).mockRejectedValue(err)

      vi.spyOn(errors, 'throwErr')
      await expect(recordMode.createRun({
        git: {},
        recordKey: true, // instead of a string
      })).rejects.toThrow()

      expect(callsStartingWith(vi.mocked(errors.throwErr), 'CLOUD_RECORD_KEY_NOT_VALID', 'undefined')).not.toHaveLength(0)
    })
  })
})
