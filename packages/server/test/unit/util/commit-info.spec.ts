import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import commitInfoModule from '../../../lib/util/commit-info'

const execaState = vi.hoisted(() => ({ stub: undefined as unknown as Mock }))

vi.mock('execa', () => {
  return {
    default: (...args: unknown[]) => execaState.stub(...args),
  }
})

const { commitInfo, getGitCommands, getRemoteOrigin, sanitizeRemoteOrigin } = commitInfoModule
const originalEnv = { ...process.env }

let execaStub: Mock

const setEnv = (vars: Record<string, string>) => {
  process.env = { ...vars }
}

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

    execaStub = vi.fn().mockRejectedValue(new Error('Git command not stubbed'))
    execaState.stub = execaStub
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  describe('with no environment variables', () => {
    beforeEach(() => {
      setEnv({})
    })

    it('returns git commit information', () => {
      execaStub.mockImplementation(createGitResponses())

      return commitInfo().then((info) => {
        expect(info).toStrictEqual({
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
      execaStub.mockImplementation(createGitResponses({
        message: { reject: true },
        author: { reject: true },
        remote: { reject: true },
      }))

      return commitInfo().then((info) => {
        expect(info).toStrictEqual({
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
      execaStub.mockImplementation(createGitResponses({
        branch: { stdout: 'HEAD' },
      }))

      return commitInfo().then((info) => {
        expect(info.branch).toBeNull()
        expect(info.message).toBe('test message')
      })
    })
  })

  describe('with environment variables', () => {
    it('uses environment variables when provided', () => {
      setEnv({
        COMMIT_INFO_BRANCH: 'env-branch',
        COMMIT_INFO_MESSAGE: 'env message',
        COMMIT_INFO_EMAIL: 'env@example.com',
        COMMIT_INFO_AUTHOR: 'Env Author',
        COMMIT_INFO_SHA: 'env-sha-123',
        COMMIT_INFO_TIMESTAMP: '789',
        COMMIT_INFO_REMOTE: 'env-remote-url',
      })

      execaStub.mockImplementation(() => {
        return Promise.reject(new Error('Git should not be called'))
      })

      return commitInfo().then((info) => {
        expect(info).toStrictEqual({
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
      setEnv({
        COMMIT_INFO_TIMESTAMP: 'not-a-number',
      })

      execaStub.mockImplementation(createGitResponses())

      return commitInfo().then((info) => {
        expect(info.timestamp).toBeNull()
        expect(info.branch).toBe('test-branch')
      })
    })

    it('prefers environment variables over git commands', () => {
      setEnv({
        COMMIT_INFO_BRANCH: 'env-branch',
        COMMIT_INFO_MESSAGE: 'env message',
      })

      execaStub.mockImplementation(createGitResponses({
        branch: { reject: true },
        message: { reject: true },
      }))

      return commitInfo().then((info) => {
        expect(info.branch).toBe('env-branch')
        expect(info.message).toBe('env message')
        expect(info.email).toBe('test@example.com')
        expect(info.author).toBe('Test Author')
      })
    })
  })

  describe('with custom folder', () => {
    it('uses the provided folder path', () => {
      const customFolder = '/custom/path'

      execaStub.mockImplementation((cmd: string, args: string[], options: any) => {
        expect(options.cwd).toBe(customFolder)

        return createGitResponses()(cmd, args)
      })

      return commitInfo(customFolder).then(() => {
        expect(execaStub).toHaveBeenCalled()
      })
    })
  })

  describe('sanitizeRemoteOrigin', () => {
    it('strips username and password from an HTTPS remote', () => {
      expect(sanitizeRemoteOrigin('https://user:secret@github.com/org/repo.git'))
      .toBe('https://github.com/org/repo.git')
    })

    it('strips only the password when username is absent', () => {
      expect(sanitizeRemoteOrigin('https://:secret@github.com/org/repo.git'))
      .toBe('https://github.com/org/repo.git')
    })

    it('leaves an HTTPS remote without credentials unchanged', () => {
      expect(sanitizeRemoteOrigin('https://github.com/org/repo.git'))
      .toBe('https://github.com/org/repo.git')
    })

    it('leaves an SCP-style SSH remote unchanged', () => {
      expect(sanitizeRemoteOrigin('git@github.com:org/repo.git'))
      .toBe('git@github.com:org/repo.git')
    })

    it('leaves an ssh:// remote unchanged, preserving the git username', () => {
      expect(sanitizeRemoteOrigin('ssh://git@github.com/org/repo.git'))
      .toBe('ssh://git@github.com/org/repo.git')
    })

    it('strips username and password from an ssh:// remote with embedded credentials', () => {
      expect(sanitizeRemoteOrigin('ssh://user:password@host/repo.git'))
      .toBe('ssh://host/repo.git')
    })

    it('leaves a git:// remote unchanged', () => {
      expect(sanitizeRemoteOrigin('git://github.com/org/repo.git'))
      .toBe('git://github.com/org/repo.git')
    })

    it('leaves an unparseable value unchanged', () => {
      expect(sanitizeRemoteOrigin('not-a-url')).toBe('not-a-url')
    })

    it('strips credentials from a remote returned by git via commitInfo', () => {
      execaStub.mockImplementation(createGitResponses({
        remote: { stdout: 'https://token:x-oauth-basic@github.com/org/repo.git' },
      }))

      return commitInfo().then((info) => {
        expect(info.remote).toBe('https://github.com/org/repo.git')
      })
    })

    it('strips credentials from a remote returned by getRemoteOrigin', () => {
      execaStub.mockImplementation(createGitResponses({
        remote: { stdout: 'https://token:x-oauth-basic@github.com/org/repo.git' },
      }))

      return getRemoteOrigin().then((remote) => {
        expect(remote).toBe('https://github.com/org/repo.git')
      })
    })

    it('strips credentials from COMMIT_INFO_REMOTE env var', () => {
      setEnv({
        COMMIT_INFO_REMOTE: 'https://user:pass@bitbucket.org/org/repo.git',
      })

      execaStub.mockImplementation(() => Promise.reject(new Error('Git should not be called')))

      return commitInfo().then((info) => {
        expect(info.remote).toBe('https://bitbucket.org/org/repo.git')
      })
    })
  })

  describe('with large commit message', () => {
    it('handles very large commit messages without truncation', () => {
      // Git has no hard limit on commit message size (tests show ~100MB can be accepted)
      // This test verifies we handle large messages gracefully
      // Using 50KB as a realistic upper bound for commit messages
      const largeMessage = 'A'.repeat(50 * 1024) // 50KB message

      execaStub.mockImplementation(createGitResponses({
        message: { stdout: largeMessage },
      }))

      return commitInfo().then((info) => {
        expect(info.message).toBe(largeMessage)
        expect(info.message!.length).toBe(50 * 1024)
      })
    })

    it('handles large commit message from environment variable', () => {
      const largeMessage = 'B'.repeat(25 * 1024) // 25KB message

      setEnv({
        COMMIT_INFO_MESSAGE: largeMessage,
      })

      execaStub.mockImplementation(() => {
        return Promise.reject(new Error('Git should not be called'))
      })

      return commitInfo().then((info) => {
        expect(info.message).toBe(largeMessage)
        expect(info.message!.length).toBe(25 * 1024)
      })
    })
  })
})
