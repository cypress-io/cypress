require('../../spec_helper')

const _ = require('lodash')
const debug = require('debug')('test')

const errors = require(`../../../lib/errors`)
const api = require(`../../../lib/cloud/api`).default
const exception = require(`../../../lib/cloud/exception`).default
const commitInfo = require('../../../lib/util/commit-info')
const recordMode = require(`../../../lib/modes/record`)
const ciProvider = require(`../../../lib/util/ci_provider`)

const initialEnv = _.clone(process.env)

// NOTE: the majority of the logic of record_spec is
// tested as an e2e/record_spec
describe('lib/modes/record', () => {
  beforeEach(() => {
    sinon.stub(api, 'sendPreflight').callsFake(async () => {
      api.setPreflightResult({ encrypt: false })
    })
  })

  afterEach(() => {
    api.resetPreflightResult({ encrypt: false })
  })

  // QUESTION: why are these tests here when
  // this is a module... ?
  context('.getCommitFromGitOrCi', () => {
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

      expect(commit.branch).to.eq('bem/circle')
    })

    it('gets branch from process.env.TRAVIS_BRANCH', () => {
      process.env.TRAVIS = '1'
      process.env.TRAVIS_BRANCH = 'bem/travis'
      process.env.CI_BRANCH = 'bem/ci'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).to.eq('bem/travis')
    })

    it('gets branch from process.env.BUILDKITE_BRANCH', () => {
      process.env.BUILDKITE = '1'
      process.env.BUILDKITE_BRANCH = 'bem/buildkite'
      process.env.CI_BRANCH = 'bem/ci'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).to.eq('bem/buildkite')
    })

    it('gets branch from process.env.APPVEYOR_REPO_BRANCH for AppVeyor', () => {
      process.env.APPVEYOR = '1'
      process.env.APPVEYOR_REPO_BRANCH = 'bem/app'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).to.eq('bem/app')
    })

    it('gets branch from git', () => {
      // this is tested inside @cypress/commit-info
    })
  })

  context('.createRunAndRecordSpecs', () => {
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
        sinon.stub(commitInfo, 'commitInfo').resolves(commitData)
      })

      afterEach(() => {
        sinon.restore()
      })

      it('calls api.createRun with commit information from commitInfo', () => {
        const createRun = sinon.stub(api, 'createRun').resolves()
        const runAllSpecs = sinon.stub()

        return recordMode.createRunAndRecordSpecs({
          key: 'foo',
          sys: {},
          browser: {},
          runAllSpecs,
        })
        .then(() => {
          expect(runAllSpecs).to.have.been.calledWith({ parallel: false })
          expect(createRun).to.have.been.calledOnce
          expect(createRun.firstCall.args).to.have.length(1)
          const { commit } = createRun.firstCall.args[0]

          debug('git is %o', commit)

          expect(commit).to.deep.equal({
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

      beforeEach(function () {
        sinon.stub(ciProvider, 'provider').returns('circle')
        sinon.stub(ciProvider, 'ciParams').returns({ foo: 'bar' })

        this.commitDefaults = {
          branch: 'master',
          author: 'brian',
          email: 'brian@cypress.io',
          message: 'such hax',
          sha: 'sha-123',
          remote: 'https://github.com/foo/bar.git',
        }

        sinon.stub(commitInfo, 'commitInfo').resolves(this.commitDefaults)
        sinon.stub(ciProvider, 'commitDefaults').returns({
          sha: this.commitDefaults.sha,
          branch: this.commitDefaults.branch,
          authorName: this.commitDefaults.author,
          authorEmail: this.commitDefaults.email,
          message: this.commitDefaults.message,
          remoteOrigin: this.commitDefaults.remote,
        })

        sinon.stub(api, 'createRun').resolves({
          runId: 'run-id',
        })

        sinon.stub(api, 'createInstance').resolves({
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
        const runAllSpecs = sinon.stub()
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
          setOnTestsReceived: sinon.stub(),
        }
        const ctx = {
          actions: {
            currentRecording: {
              startRun: sinon.stub(),
              startInstance: sinon.stub(),
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

        expect(ctx.actions.currentRecording.startRun).to.have.been.calledWith('run-id')
        expect(commitInfo.commitInfo).to.be.calledWith(projectRoot)

        expect(api.createRun).to.be.calledWith({
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

        expect(runAllSpecs).to.have.been.called

        const beforeSpecRun = runAllSpecs.firstCall.args[0].beforeSpecRun

        await beforeSpecRun()

        expect(api.createInstance).to.have.been.calledWith('run-id', sinon.match({
          platform: sinon.match({
            browserFamily: 'chromium',
            browserName: 'chrome',
            browserVersion: '59',
          }),
        }))

        expect(ctx.actions.currentRecording.startInstance).to.have.been.calledWith('instance-id')
      })

      it('passes browser.family as platform.browserFamily for non-chromium browsers', async () => {
        const runAllSpecs = sinon.stub()
        const sys = { osCpus: 1, osName: 'linux', osMemory: 8, osVersion: '1' }
        const browser = {
          displayName: 'firefox',
          version: '120',
          family: 'firefox',
        }
        const project = { setOnTestsReceived: sinon.stub() }
        const ctx = {
          actions: {
            currentRecording: { startRun: sinon.stub(), startInstance: sinon.stub() },
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

        expect(api.createRun).to.have.been.calledWith(sinon.match({
          platform: sinon.match({
            browserFamily: 'firefox',
            browserName: 'firefox',
            browserVersion: '120',
          }),
        }))
      })
    })
  })

  context('.updateInstanceStdout', () => {
    beforeEach(function () {
      sinon.stub(api, 'updateInstanceStdout')

      this.options = {
        runId: 'run-id-123',
        instanceId: 'id-123',
        captured: {
          toString () {
            return 'foobarbaz\n'
          },
        },
      }
    })

    it('calls api.updateInstanceStdout', function () {
      api.updateInstanceStdout.resolves()

      return recordMode.updateInstanceStdout(this.options)
      .then(() => {
        expect(api.updateInstanceStdout).to.be.calledWith({
          runId: 'run-id-123',
          instanceId: 'id-123',
          stdout: 'foobarbaz\n',
        })
      })
    })

    it('does not create exception when statusCode is 503', () => {
      const err = new Error('foo')

      err.statusCode = 503

      api.updateInstanceStdout.rejects(err)
      sinon.spy(exception, 'create')

      const options = {
        instanceId: 'id-123',
        captured: { toString () {
          return 'foobarbaz\n'
        } },
      }

      return recordMode.updateInstanceStdout(options)
      .then(() => {
        expect(exception.create).not.to.be.called
      })
    })
  })

  context('.createInstance', () => {
    beforeEach(function () {
      sinon.stub(api, 'createInstance')

      this.options = {
        runId: 'run-123',
        groupId: 'group-123',
        machineId: 'machine-123',
        platform: {},
        spec: { relative: 'cypress/integration/app_spec.coffee' },
      }
    })

    it('calls api.createInstance', function () {
      api.createInstance.resolves()

      return recordMode.createInstance(this.options)
      .then(() => {
        expect(api.createInstance).to.be.calledWith('run-123', {
          groupId: 'group-123',
          machineId: 'machine-123',
          platform: {},
          spec: 'cypress/integration/app_spec.coffee',
        })
      })
    })

    it('errors when statusCode is 503', async () => {
      const err = new Error('foo')

      err.statusCode = 503

      api.createInstance.rejects(err)

      sinon.spy(errors, 'get')

      await expect(recordMode.createInstance({
        runId: 'run-123',
        groupId: 'group-123',
        machineId: 'machine-123',
        platform: {},
        spec: { relative: 'cypress/integration/app_spec.coffee' },
      })).to.be.rejected

      expect(errors.get).to.have.been.calledWith('CLOUD_CANNOT_PROCEED_IN_SERIAL')
    })
  })

  context('.createRun', () => {
    beforeEach(function () {
      sinon.stub(api, 'createRun')
      sinon.stub(ciProvider, 'ciParams').returns({})
      sinon.stub(ciProvider, 'provider').returns('')
      sinon.stub(ciProvider, 'commitDefaults').returns({})

      this.options = {
        git: {},
        recordKey: '1',
      }
    })

    // https://github.com/cypress-io/cypress/issues/14571
    it('handles non-string key', async () => {
      const err = new Error('Invalid Record Key')

      err.statusCode = 401

      api.createRun.rejects(err)

      sinon.spy(errors, 'throwErr')
      await expect(recordMode.createRun({
        git: {},
        recordKey: true, // instead of a string
      })).to.be.rejected

      expect(errors.throwErr).to.have.been.calledWith('CLOUD_RECORD_KEY_NOT_VALID', 'undefined')
    })
  })

  context('.postInstanceTests', () => {
    beforeEach(function () {
      sinon.stub(api, 'postInstanceTests')
      sinon.stub(ciProvider, 'ciParams').returns({})
      sinon.stub(ciProvider, 'provider').returns('')
      sinon.stub(ciProvider, 'commitDefaults').returns({})

      this.options = {
        results: {},
        captured: '',
      }
    })
  })

  context('.postInstanceResults', () => {
    beforeEach(function () {
      sinon.stub(api, 'postInstanceResults')
      sinon.stub(ciProvider, 'ciParams').returns({})
      sinon.stub(ciProvider, 'provider').returns('')
      sinon.stub(ciProvider, 'commitDefaults').returns({})

      this.options = {
        results: {},
        captured: '',
      }
    })
  })
})
