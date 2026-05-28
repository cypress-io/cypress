import '../../spec_helper'

import path from 'path'
import { proxyquire } from '../../spec_helper'
import mockedEnv from 'mocked-env'

let execaStub: ReturnType<typeof sinon.stub>
let commitInfo: typeof import('../../../lib/util/commit-info').commitInfo
let getGitCommands: typeof import('../../../lib/util/commit-info').getGitCommands
let getRemoteOrigin: typeof import('../../../lib/util/commit-info').getRemoteOrigin
let sanitizeRemoteOrigin: typeof import('../../../lib/util/commit-info').sanitizeRemoteOrigin
let resetEnv: (() => void) | null = null

// Helper to get git command key string from property name
function getCommandKey (property: keyof ReturnType<typeof getGitCommands>): string {
  const commands = getGitCommands()

  return commands[property].gitCmd.join(' ')
}

// Helper to create git command responses from the actual git commands configuration
function createGitResponses (overrides: Partial<Record<keyof ReturnType<typeof getGitCommands>, { stdout?: string, reject?: boolean }>> = {}) {
  const commands = getGitCommands()

  // Generate defaults from the actual git commands configuration
  const defaults: Record<string, { stdout?: string, reject?: boolean }> = {}
  const testValues: Record<keyof typeof commands, string> = {
    branch: 'test-branch',
    message: 'test message',
    email: 'test@example.com',
    author: 'Test Author',
    sha: 'abc123',
    timestamp: '123',
    remote: 'git@github.com/repo',
  }

  for (const [key, cmd] of Object.entries(commands)) {
    const commandKey = cmd.gitCmd.join(' ')

    defaults[commandKey] = { stdout: testValues[key as keyof typeof commands] }
  }

  // Convert property-based overrides to command-key-based overrides
  const commandKeyOverrides: Record<string, { stdout?: string, reject?: boolean }> = {}

  for (const [property, value] of Object.entries(overrides)) {
    const commandKey = getCommandKey(property as keyof ReturnType<typeof getGitCommands>)

    commandKeyOverrides[commandKey] = value
  }

  const responses = { ...defaults, ...commandKeyOverrides }

  return (cmd: string, args: string[]) => {
    if (cmd !== 'git' || !args) {
      return Promise.reject(new Error(`Unexpected command: ${cmd}`))
    }

    const key = args.join(' ')
    const response = responses[key]

    if (!response) {
      return Promise.reject(new Error(`Unexpected git command: ${args.join(' ')}`))
    }

    if (response.reject) {
      return Promise.reject(new Error(`Git command failed: ${key}`))
    }

    return Promise.resolve({ stdout: response.stdout || '' })
  }
}

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

    execaStub = sinon.stub().rejects(new Error('Git command not stubbed'))

    const commitInfoPath = path.resolve(__dirname, '../../../lib/util/commit-info')

    const commitInfoModule = proxyquire(commitInfoPath, {
      execa: execaStub,
    })

    commitInfo = commitInfoModule.commitInfo
    getGitCommands = commitInfoModule.getGitCommands
    getRemoteOrigin = commitInfoModule.getRemoteOrigin
    sanitizeRemoteOrigin = commitInfoModule.sanitizeRemoteOrigin
  })

  afterEach(() => {
    if (resetEnv) {
      resetEnv()
      resetEnv = null
    }

    sinon.restore()
  })

  context('with no environment variables', () => {
    beforeEach(() => {
      resetEnv = mockedEnv({}, { clear: true })
    })

    it('returns git commit information', () => {
      execaStub.callsFake(createGitResponses())

      return commitInfo().then((info) => {
        expect(info).to.deep.eq({
          branch: 'test-branch',
          message: 'test message',
          email: 'test@example.com',
          author: 'Test Author',
          sha: 'abc123',
          timestamp: 123,
          remote: 'git@github.com/repo',
        })
      })
    })

    it('returns nulls for failed git commands', () => {
      execaStub.callsFake(createGitResponses({
        message: { reject: true },
        author: { reject: true },
        remote: { reject: true },
      }))

      return commitInfo().then((info) => {
        expect(info).to.deep.eq({
          branch: 'test-branch',
          message: null,
          email: 'test@example.com',
          author: null,
          sha: 'abc123',
          timestamp: 123,
          remote: null,
        })
      })
    })

    it('returns null for branch when HEAD is detached', () => {
      execaStub.callsFake(createGitResponses({
        branch: { stdout: 'HEAD' },
      }))

      return commitInfo().then((info) => {
        expect(info.branch).to.be.null
        expect(info.message).to.eq('test message')
      })
    })
  })

  context('with environment variables', () => {
    it('uses environment variables when provided', () => {
      resetEnv = mockedEnv({
        COMMIT_INFO_BRANCH: 'env-branch',
        COMMIT_INFO_MESSAGE: 'env message',
        COMMIT_INFO_EMAIL: 'env@example.com',
        COMMIT_INFO_AUTHOR: 'Env Author',
        COMMIT_INFO_SHA: 'env-sha-123',
        COMMIT_INFO_TIMESTAMP: '789',
        COMMIT_INFO_REMOTE: 'env-remote-url',
      }, { clear: true })

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
      resetEnv = mockedEnv({
        COMMIT_INFO_TIMESTAMP: 'not-a-number',
      }, { clear: true })

      execaStub.callsFake(createGitResponses())

      return commitInfo().then((info) => {
        expect(info.timestamp).to.be.null
        expect(info.branch).to.eq('test-branch')
      })
    })

    it('prefers environment variables over git commands', () => {
      resetEnv = mockedEnv({
        COMMIT_INFO_BRANCH: 'env-branch',
        COMMIT_INFO_MESSAGE: 'env message',
      }, { clear: true })

      execaStub.callsFake(createGitResponses({
        branch: { reject: true },
        message: { reject: true },
      }))

      return commitInfo().then((info) => {
        expect(info.branch).to.eq('env-branch')
        expect(info.message).to.eq('env message')
        expect(info.email).to.eq('test@example.com')
        expect(info.author).to.eq('Test Author')
      })
    })
  })

  context('with custom folder', () => {
    it('uses the provided folder path', () => {
      const customFolder = '/custom/path'

      execaStub.callsFake((cmd: string, args: string[], options: any) => {
        expect(options.cwd).to.eq(customFolder)

        return createGitResponses()(cmd, args)
      })

      return commitInfo(customFolder).then(() => {
        expect(execaStub.called).to.be.true
      })
    })
  })

  context('sanitizeRemoteOrigin', () => {
    it('strips username and password from an HTTPS remote', () => {
      expect(sanitizeRemoteOrigin('https://user:secret@github.com/org/repo.git'))
      .to.eq('https://github.com/org/repo.git')
    })

    it('strips only the password when username is absent', () => {
      expect(sanitizeRemoteOrigin('https://:secret@github.com/org/repo.git'))
      .to.eq('https://github.com/org/repo.git')
    })

    it('leaves an HTTPS remote without credentials unchanged', () => {
      expect(sanitizeRemoteOrigin('https://github.com/org/repo.git'))
      .to.eq('https://github.com/org/repo.git')
    })

    it('leaves an SCP-style SSH remote unchanged', () => {
      expect(sanitizeRemoteOrigin('git@github.com:org/repo.git'))
      .to.eq('git@github.com:org/repo.git')
    })

    it('leaves an ssh:// remote unchanged, preserving the git username', () => {
      expect(sanitizeRemoteOrigin('ssh://git@github.com/org/repo.git'))
      .to.eq('ssh://git@github.com/org/repo.git')
    })

    it('strips username and password from an ssh:// remote with embedded credentials', () => {
      expect(sanitizeRemoteOrigin('ssh://user:password@host/repo.git'))
      .to.eq('ssh://host/repo.git')
    })

    it('leaves a git:// remote unchanged', () => {
      expect(sanitizeRemoteOrigin('git://github.com/org/repo.git'))
      .to.eq('git://github.com/org/repo.git')
    })

    it('leaves an unparseable value unchanged', () => {
      expect(sanitizeRemoteOrigin('not-a-url')).to.eq('not-a-url')
    })

    it('strips credentials from a remote returned by git via commitInfo', () => {
      execaStub.callsFake(createGitResponses({
        remote: { stdout: 'https://token:x-oauth-basic@github.com/org/repo.git' },
      }))

      return commitInfo().then((info) => {
        expect(info.remote).to.eq('https://github.com/org/repo.git')
      })
    })

    it('strips credentials from a remote returned by getRemoteOrigin', () => {
      execaStub.callsFake(createGitResponses({
        remote: { stdout: 'https://token:x-oauth-basic@github.com/org/repo.git' },
      }))

      return getRemoteOrigin().then((remote) => {
        expect(remote).to.eq('https://github.com/org/repo.git')
      })
    })

    it('strips credentials from COMMIT_INFO_REMOTE env var', () => {
      resetEnv = mockedEnv({
        COMMIT_INFO_REMOTE: 'https://user:pass@bitbucket.org/org/repo.git',
      }, { clear: true })

      execaStub.callsFake(() => Promise.reject(new Error('Git should not be called')))

      return commitInfo().then((info) => {
        expect(info.remote).to.eq('https://bitbucket.org/org/repo.git')
      })
    })
  })

  context('with large commit message', () => {
    it('handles very large commit messages without truncation', () => {
      // Git has no hard limit on commit message size (tests show ~100MB can be accepted)
      // This test verifies we handle large messages gracefully
      // Using 50KB as a realistic upper bound for commit messages
      const largeMessage = 'A'.repeat(50 * 1024) // 50KB message

      execaStub.callsFake(createGitResponses({
        message: { stdout: largeMessage },
      }))

      return commitInfo().then((info) => {
        expect(info.message).to.eq(largeMessage)
        expect(info.message!.length).to.eq(50 * 1024)
      })
    })

    it('handles large commit message from environment variable', () => {
      const largeMessage = 'B'.repeat(25 * 1024) // 25KB message

      resetEnv = mockedEnv({
        COMMIT_INFO_MESSAGE: largeMessage,
      }, { clear: true })

      execaStub.callsFake(() => {
        return Promise.reject(new Error('Git should not be called'))
      })

      return commitInfo().then((info) => {
        expect(info.message).to.eq(largeMessage)
        expect(info.message!.length).to.eq(25 * 1024)
      })
    })
  })
})
