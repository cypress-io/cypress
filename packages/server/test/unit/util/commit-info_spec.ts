import '../../spec_helper'

import { proxyquire } from '../../spec_helper'
import mockedEnv from 'mocked-env'

let execaStub: ReturnType<typeof sinon.stub>
let commitInfo: typeof import('../../../lib/util/commit-info').commitInfo
let resetEnv: (() => void) | null = null

describe('lib/util/commit-info', () => {
  beforeEach(() => {
    // Clear any existing environment variables
    delete process.env.COMMIT_INFO_BRANCH
    delete process.env.COMMIT_INFO_MESSAGE
    delete process.env.COMMIT_INFO_EMAIL
    delete process.env.COMMIT_INFO_AUTHOR
    delete process.env.COMMIT_INFO_SHA
    delete process.env.COMMIT_INFO_TIMESTAMP
    delete process.env.COMMIT_INFO_REMOTE

    // Setup execa stub - reset it for each test
    execaStub = sinon.stub().rejects(new Error('Git command not stubbed'))

    // Use proxyquire to inject the stubbed execa
    // Note: proxyquire resolves relative to the test file location
    const commitInfoModule = proxyquire('../lib/util/commit-info', {
      execa: execaStub,
    })

    commitInfo = commitInfoModule.commitInfo
  })

  afterEach(() => {
    if (resetEnv) {
      resetEnv()
      resetEnv = null
    }

    sinon.restore()
  })

  context('commitInfo', () => {
    context('with no environment variables', () => {
      beforeEach(function () {
        resetEnv = mockedEnv({}, { clear: true })
      })

      it('returns git commit information', () => {
        execaStub.reset()
        execaStub.callsFake((cmd: string, args: string[], options?: any) => {
          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === '--abbrev-ref' && args[2] === 'HEAD') {
            return Promise.resolve({ stdout: 'test-branch\n' })
          }

          if (cmd === 'git' && args && args[0] === 'show' && args[1] === '-s' && args[2] === '--pretty=%B') {
            return Promise.resolve({ stdout: 'important commit\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ae')) {
            return Promise.resolve({ stdout: 'me@foo.com\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%an')) {
            return Promise.resolve({ stdout: 'John Doe\n' })
          }

          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === 'HEAD' && args.length === 2) {
            return Promise.resolve({ stdout: 'abc123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ct')) {
            return Promise.resolve({ stdout: '123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'config' && args[1] === '--get' && args[2] === 'remote.origin.url') {
            return Promise.resolve({ stdout: 'git@github.com/repo\n' })
          }

          return Promise.reject(new Error(`Unexpected git command: ${cmd} ${args ? args.join(' ') : 'no args'}`))
        })

        return commitInfo().then((info) => {
          expect(info).to.deep.eq({
            branch: 'test-branch',
            message: 'important commit',
            email: 'me@foo.com',
            author: 'John Doe',
            sha: 'abc123',
            timestamp: 123,
            remote: 'git@github.com/repo',
          })
        })
      })

      it('returns nulls for missing git fields', () => {
        execaStub.reset()
        execaStub.callsFake((cmd: string, args: string[], options?: any) => {
          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === '--abbrev-ref' && args[2] === 'HEAD') {
            return Promise.resolve({ stdout: 'test-branch\n' })
          }

          if (cmd === 'git' && args && args[0] === 'show' && args[1] === '-s' && args[2] === '--pretty=%B') {
            return Promise.reject(new Error('No commit found'))
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ae')) {
            return Promise.resolve({ stdout: 'me@foo.com\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%an')) {
            return Promise.reject(new Error('No author'))
          }

          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === 'HEAD' && args.length === 2) {
            return Promise.resolve({ stdout: 'abc123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ct')) {
            return Promise.resolve({ stdout: '123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'config' && args[1] === '--get' && args[2] === 'remote.origin.url') {
            return Promise.reject(new Error('No remote'))
          }

          return Promise.reject(new Error(`Unexpected git command: ${cmd} ${args ? args.join(' ') : 'no args'}`))
        })

        return commitInfo().then((info) => {
          expect(info).to.deep.eq({
            branch: 'test-branch',
            message: null,
            email: 'me@foo.com',
            author: null,
            sha: 'abc123',
            timestamp: 123,
            remote: null,
          })
        })
      })

      it('returns null for branch when HEAD is detached', () => {
        execaStub.reset()
        execaStub.callsFake((cmd: string, args: string[], options?: any) => {
          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === '--abbrev-ref' && args[2] === 'HEAD') {
            return Promise.resolve({ stdout: 'HEAD\n' })
          }

          if (cmd === 'git' && args && args[0] === 'show' && args[1] === '-s' && args[2] === '--pretty=%B') {
            return Promise.resolve({ stdout: 'commit message\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ae')) {
            return Promise.resolve({ stdout: 'email@example.com\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%an')) {
            return Promise.resolve({ stdout: 'Author Name\n' })
          }

          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === 'HEAD' && args.length === 2) {
            return Promise.resolve({ stdout: 'sha123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ct')) {
            return Promise.resolve({ stdout: '456\n' })
          }

          if (cmd === 'git' && args && args[0] === 'config' && args[1] === '--get' && args[2] === 'remote.origin.url') {
            return Promise.resolve({ stdout: 'remote-url\n' })
          }

          return Promise.reject(new Error(`Unexpected git command: ${cmd} ${args ? args.join(' ') : 'no args'}`))
        })

        return commitInfo().then((info) => {
          expect(info.branch).to.be.null
          expect(info.message).to.eq('commit message')
        })
      })
    })

    context('with environment variables', () => {
      it('uses environment variables when provided', () => {
        const env = {
          COMMIT_INFO_BRANCH: 'env-branch',
          COMMIT_INFO_MESSAGE: 'env message',
          COMMIT_INFO_EMAIL: 'env@example.com',
          COMMIT_INFO_AUTHOR: 'Env Author',
          COMMIT_INFO_SHA: 'env-sha-123',
          COMMIT_INFO_TIMESTAMP: '789',
          COMMIT_INFO_REMOTE: 'env-remote-url',
        }

        resetEnv = mockedEnv(env, { clear: true })

        // Stub git commands to ensure they're not called
      execaStub.reset()
      execaStub.callsFake(() => {
        return Promise.reject(new Error('Git should not be called'))
      })

        return commitInfo().then((info) => {
          expect(info).to.deep.eq({
            branch: 'env-branch',
            message: 'env message',
            email: 'env@example.com',
            author: 'Env Author',
            sha: 'env-sha-123',
            timestamp: 789,
            remote: 'env-remote-url',
          })
        })
      })

    it('handles invalid timestamp in environment variable', () => {
      const env = {
        COMMIT_INFO_TIMESTAMP: 'not-a-number',
      }

      resetEnv = mockedEnv(env, { clear: true })

      execaStub.reset()
      execaStub.callsFake((cmd: string, args: string[], options?: any) => {
        if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === '--abbrev-ref' && args[2] === 'HEAD') {
          return Promise.resolve({ stdout: 'branch\n' })
        }

        if (cmd === 'git' && args && args[0] === 'show' && args[1] === '-s' && args[2] === '--pretty=%B') {
          return Promise.resolve({ stdout: 'message\n' })
        }

        if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ae')) {
          return Promise.resolve({ stdout: 'email@example.com\n' })
        }

        if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%an')) {
          return Promise.resolve({ stdout: 'Author\n' })
        }

        if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === 'HEAD' && args.length === 2) {
          return Promise.resolve({ stdout: 'sha\n' })
        }

        if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ct')) {
          return Promise.resolve({ stdout: '123\n' })
        }

        if (cmd === 'git' && args && args[0] === 'config' && args[1] === '--get' && args[2] === 'remote.origin.url') {
          return Promise.resolve({ stdout: 'remote\n' })
        }

        return Promise.reject(new Error(`Unexpected git command: ${cmd} ${args ? args.join(' ') : 'no args'}`))
      })

      return commitInfo().then((info) => {
        expect(info.timestamp).to.be.null
      })
    })
    })

    context('combination of environment variables and git', () => {
      it('prefers environment variables over git commands', () => {
        const env = {
          COMMIT_INFO_BRANCH: 'env-branch',
          COMMIT_INFO_MESSAGE: 'some git message',
          // email, author, sha, timestamp, remote will come from git
        }

        resetEnv = mockedEnv(env, { clear: true })

        execaStub.reset()
        execaStub.callsFake((cmd: string, args: string[], options?: any) => {
          // These should not be called because env vars are set
          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === '--abbrev-ref' && args[2] === 'HEAD') {
            return Promise.reject(new Error('Should use env var'))
          }

          if (cmd === 'git' && args && args[0] === 'show' && args[1] === '-s' && args[2] === '--pretty=%B') {
            return Promise.reject(new Error('Should use env var'))
          }

          // These should be called
          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ae')) {
            return Promise.resolve({ stdout: 'user@company.com\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%an')) {
            return Promise.resolve({ stdout: 'John Doe\n' })
          }

          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === 'HEAD' && args.length === 2) {
            return Promise.resolve({ stdout: 'abc123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ct')) {
            return Promise.resolve({ stdout: '123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'config' && args[1] === '--get' && args[2] === 'remote.origin.url') {
            return Promise.resolve({ stdout: 'git@github.com/repo\n' })
          }

          return Promise.reject(new Error(`Unexpected git command: ${cmd} ${args ? args.join(' ') : 'no args'}`))
        })

        return commitInfo().then((info) => {
          expect(info).to.deep.eq({
            branch: 'env-branch',
            message: 'some git message',
            email: 'user@company.com',
            author: 'John Doe',
            sha: 'abc123',
            timestamp: 123,
            remote: 'git@github.com/repo',
          })
        })
      })
    })

    context('with custom folder', () => {
      it('uses the provided folder path', () => {
        const customFolder = '/custom/path'

        execaStub.reset()
        execaStub.callsFake((cmd: string, args: string[], options: any) => {
          expect(options.cwd).to.eq(customFolder)

          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === '--abbrev-ref' && args[2] === 'HEAD') {
            return Promise.resolve({ stdout: 'branch\n' })
          }

          if (cmd === 'git' && args && args[0] === 'show' && args[1] === '-s' && args[2] === '--pretty=%B') {
            return Promise.resolve({ stdout: 'message\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ae')) {
            return Promise.resolve({ stdout: 'email@example.com\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%an')) {
            return Promise.resolve({ stdout: 'Author\n' })
          }

          if (cmd === 'git' && args && args[0] === 'rev-parse' && args[1] === 'HEAD' && args.length === 2) {
            return Promise.resolve({ stdout: 'sha\n' })
          }

          if (cmd === 'git' && args && args[0] === 'log' && args.includes('--pretty=format:%ct')) {
            return Promise.resolve({ stdout: '123\n' })
          }

          if (cmd === 'git' && args && args[0] === 'config' && args[1] === '--get' && args[2] === 'remote.origin.url') {
            return Promise.resolve({ stdout: 'remote\n' })
          }

          return Promise.reject(new Error(`Unexpected git command: ${cmd} ${args ? args.join(' ') : 'no args'}`))
        })

        return commitInfo(customFolder).then(() => {
          expect(execaStub.called).to.be.true
        })
      })
    })
  })
})
