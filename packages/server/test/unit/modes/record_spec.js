require('../../spec_helper')

const _ = require('lodash')
const debug = require('debug')('test')
const commitInfo = require('@cypress/commit-info')
const mockedEnv = require('mocked-env')

const api = require(`${root}../lib/api`)
const logger = require(`${root}../lib/logger`)
const recordMode = require(`${root}../lib/modes/record`)
const ciProvider = require(`${root}../lib/util/ci_provider`)

const initialEnv = _.clone(process.env)

// NOTE: the majority of the logic of record_spec is
// tested as an e2e/record_spec
describe('lib/modes/record', () => {
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

    it('gets branch from process.env.CI_BRANCH for codeship', () => {
      process.env.CI_NAME = 'codeship'
      process.env.CI_BRANCH = 'bem/ci'

      const commit = recordMode.getCommitFromGitOrCi(gitCommit)

      debug(commit)

      expect(commit.branch).to.eq('bem/ci')
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
    describe('fallback commit information', () => {
      let resetEnv = null

      const env = {
        COMMIT_INFO_BRANCH: 'my-branch-221',
        COMMIT_INFO_MESSAGE: 'best commit ever',
        COMMIT_INFO_EMAIL: 'user@company.com',
        COMMIT_INFO_AUTHOR: 'Agent Smith',
        COMMIT_INFO_SHA: '0123456',
        COMMIT_INFO_REMOTE: 'remote repo',
      }

      beforeEach(() => {
        // stub git commands to return nulls
        sinon.stub(commitInfo, 'getBranch').resolves(null)
        sinon.stub(commitInfo, 'getMessage').resolves(null)
        sinon.stub(commitInfo, 'getEmail').resolves(null)
        sinon.stub(commitInfo, 'getAuthor').resolves(null)
        sinon.stub(commitInfo, 'getSha').resolves(null)
        sinon.stub(commitInfo, 'getRemoteOrigin').resolves(null)
        resetEnv = mockedEnv(env, { clear: true })
      })

      afterEach(() => {
        resetEnv()
      })

      it('calls api.createRun with the commit extracted from environment variables', () => {
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
            sha: env.COMMIT_INFO_SHA,
            branch: env.COMMIT_INFO_BRANCH,
            authorName: env.COMMIT_INFO_AUTHOR,
            authorEmail: env.COMMIT_INFO_EMAIL,
            message: env.COMMIT_INFO_MESSAGE,
            remoteOrigin: env.COMMIT_INFO_REMOTE,
            defaultBranch: null,
          })
        })
      })
    })

    describe('override commit information', () => {
      let resetEnv = null

      const env = {
        COMMIT_INFO_BRANCH: 'my-branch-221',
        COMMIT_INFO_MESSAGE: 'best commit ever',
        COMMIT_INFO_EMAIL: 'user@company.com',
        COMMIT_INFO_AUTHOR: 'Agent Smith',
        COMMIT_INFO_SHA: '0123456',
        COMMIT_INFO_REMOTE: 'remote repo',
      }

      beforeEach(() => {
        // stub git commands to return values
        sinon.stub(commitInfo, 'getBranch').resolves('my-ci-branch')
        sinon.stub(commitInfo, 'getMessage').resolves('my ci msg')
        sinon.stub(commitInfo, 'getEmail').resolves('my.ci@email.com')
        sinon.stub(commitInfo, 'getAuthor').resolves('My CI Name')
        sinon.stub(commitInfo, 'getSha').resolves('mycisha')
        sinon.stub(commitInfo, 'getRemoteOrigin').resolves('my ci remote')
        resetEnv = mockedEnv(env, { clear: true })
      })

      afterEach(() => {
        resetEnv()
      })

      it('calls api.createRun with the commit overrided from environment variables', () => {
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
            sha: env.COMMIT_INFO_SHA,
            branch: env.COMMIT_INFO_BRANCH,
            authorName: env.COMMIT_INFO_AUTHOR,
            authorEmail: env.COMMIT_INFO_EMAIL,
            message: env.COMMIT_INFO_MESSAGE,
            remoteOrigin: env.COMMIT_INFO_REMOTE,
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

        sinon.stub(api, 'createRun').resolves()
      })

      it('calls api.createRun with the right args', () => {
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
        }
        const tag = 'nightly,develop'

        return recordMode.createRunAndRecordSpecs({
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
        })
        .then(() => {
          expect(commitInfo.commitInfo).to.be.calledWith(projectRoot)

          expect(api.createRun).to.be.calledWith({
            group,
            parallel,
            projectId,
            ciBuildId,
            recordKey: key,
            specPattern: 'spec/pattern1,spec/pattern2',
            specs: ['path/to/spec/a', 'path/to/spec/b'],
            platform: {
              osCpus: 1,
              osName: 2,
              osMemory: 3,
              osVersion: 4,
              browserName: 'chrome',
              browserVersion: '59',
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
          })
        })
      })
    })
  })

  context('.updateInstanceStdout', () => {
    beforeEach(function () {
      sinon.stub(api, 'updateInstanceStdout')

      this.options = {
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
          instanceId: 'id-123',
          stdout: 'foobarbaz\n',
        })
      })
    })

    it('retries with backoff strategy', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      recordMode.updateInstanceStdout(this.options)

      expect(api.retryWithBackoff).to.be.called
    })

    it('logs on retry', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      return recordMode.updateInstanceStdout(this.options)
      .then(() => {
        expect(api.retryWithBackoff).to.be.calledOnce
      })
    })

    it('does not createException when statusCode is 503', () => {
      const err = new Error('foo')

      err.statusCode = 503

      sinon.spy(logger, 'createException')

      sinon.stub(api, 'retryWithBackoff').rejects(err)

      const options = {
        instanceId: 'id-123',
        captured: { toString () {
          return 'foobarbaz\n'
        } },
      }

      return recordMode.updateInstanceStdout(options)
      .then(() => {
        expect(logger.createException).not.to.be.called
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
        expect(api.createInstance).to.be.calledWith({
          runId: 'run-123',
          groupId: 'group-123',
          machineId: 'machine-123',
          platform: {},
          spec: 'cypress/integration/app_spec.coffee',
        })
      })
    })

    it('retries with backoff strategy', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      recordMode.createInstance(this.options)

      expect(api.retryWithBackoff).to.be.called
    })

    it('logs on retry', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      return recordMode.createInstance(this.options)
      .then(() => {
        expect(api.retryWithBackoff).to.be.calledOnce
      })
    })

    it('does not createException when statusCode is 503', () => {
      const err = new Error('foo')

      err.statusCode = 503

      sinon.spy(logger, 'createException')

      sinon.stub(api, 'retryWithBackoff').rejects(err)

      return recordMode.createInstance({
        runId: 'run-123',
        groupId: 'group-123',
        machineId: 'machine-123',
        platform: {},
        spec: { relative: 'cypress/integration/app_spec.coffee' },
      })
      .then((ret) => {
        expect(ret).to.be.null

        expect(logger.createException).not.to.be.called
      })
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

    it('retries with backoff strategy', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      return recordMode.createRun(this.options)
      .then(() => {
        expect(api.retryWithBackoff).to.be.called
      })
    })

    it('logs on retry', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      return recordMode.createRun(this.options)
      .then(() => {
        expect(api.retryWithBackoff).to.be.calledOnce
      })
    })
  })

  context('.updateInstance', () => {
    beforeEach(function () {
      sinon.stub(api, 'updateInstance')
      sinon.stub(ciProvider, 'ciParams').returns({})
      sinon.stub(ciProvider, 'provider').returns('')
      sinon.stub(ciProvider, 'commitDefaults').returns({})

      this.options = {
        results: {},
        captured: '',
      }
    })

    it('retries with backoff strategy', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      recordMode.updateInstance(this.options)

      expect(api.retryWithBackoff).to.be.called
    })

    it('logs on retry', function () {
      sinon.stub(api, 'retryWithBackoff').yields().resolves()

      return recordMode.updateInstance(this.options)
      .then(() => {
        expect(api.retryWithBackoff).to.be.calledOnce
      })
    })
  })
})
