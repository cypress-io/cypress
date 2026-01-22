import execa from 'execa'
import Promise from 'bluebird'
import path from 'path'

interface CommitInfo {
  branch: string | null
  message: string | null
  email: string | null
  author: string | null
  sha: string | null
  timestamp: number | null
  remote: string | null
}

interface GitCommand {
  envVar: string
  gitCmd: string[]
  transform?: (result: string) => string | number | null
}

/**
 * Returns the git command configuration for all commit info properties.
 * Exported for use in tests.
 */
function getGitCommands (): Record<keyof CommitInfo, GitCommand> {
  return {
    branch: {
      envVar: 'COMMIT_INFO_BRANCH',
      gitCmd: ['rev-parse', '--abbrev-ref', 'HEAD'],
      transform: (value) => value === 'HEAD' ? null : value,
    },
    message: {
      envVar: 'COMMIT_INFO_MESSAGE',
      gitCmd: ['show', '-s', '--pretty=%B'],
    },
    email: {
      envVar: 'COMMIT_INFO_EMAIL',
      gitCmd: ['log', '-1', '--pretty=format:%ae'],
    },
    author: {
      envVar: 'COMMIT_INFO_AUTHOR',
      gitCmd: ['log', '-1', '--pretty=format:%an'],
    },
    sha: {
      envVar: 'COMMIT_INFO_SHA',
      gitCmd: ['rev-parse', 'HEAD'],
    },
    timestamp: {
      envVar: 'COMMIT_INFO_TIMESTAMP',
      gitCmd: ['log', '-1', '--pretty=format:%ct'],
      transform: (value) => {
        const timestamp = parseInt(value, 10)

        return isNaN(timestamp) ? null : timestamp
      },
    },
    remote: {
      envVar: 'COMMIT_INFO_REMOTE',
      gitCmd: ['config', '--get', 'remote.origin.url'],
    },
  }
}

/**
 * Executes a git command or returns value from environment variable.
 * Falls back to null if git command fails.
 */
function getGitValue (
  cwd: string,
  envVar: string,
  gitCmd: string[],
  transform?: (result: string) => string | number | null,
): Promise<string | number | null> {
  // Check environment variable first
  if (process.env[envVar]) {
    const envValue = process.env[envVar]!

    if (transform) {
      const transformed = transform(envValue)

      return Promise.resolve(transformed)
    }

    return Promise.resolve(envValue)
  }

  // Execute git command
  return Promise.resolve(execa('git', gitCmd, { cwd }))
    .then((result) => {
      const value = result.stdout.trim()

      return transform ? transform(value) : value
    })
    .catch(() => null)
}

/**
 * Collects Git commit info using git CLI commands.
 * Falls back to environment variables if git commands fail.
 *
 * @param folder - The folder path (defaults to current working directory)
 * @returns Promise resolving to commit info object
 */
function commitInfo (folder?: string): Promise<CommitInfo> {
  // Normalize path for cross-platform compatibility (handles Windows backslashes, etc.)
  const cwd = folder ? path.resolve(folder) : process.cwd()

  // Get git commands configuration
  const commands = getGitCommands()

  // Execute all git commands in parallel
  return Promise.props({
    branch: getGitValue(cwd, commands.branch.envVar, commands.branch.gitCmd, commands.branch.transform) as Promise<string | null>,
    message: getGitValue(cwd, commands.message.envVar, commands.message.gitCmd, commands.message.transform) as Promise<string | null>,
    email: getGitValue(cwd, commands.email.envVar, commands.email.gitCmd, commands.email.transform) as Promise<string | null>,
    author: getGitValue(cwd, commands.author.envVar, commands.author.gitCmd, commands.author.transform) as Promise<string | null>,
    sha: getGitValue(cwd, commands.sha.envVar, commands.sha.gitCmd, commands.sha.transform) as Promise<string | null>,
    timestamp: getGitValue(cwd, commands.timestamp.envVar, commands.timestamp.gitCmd, commands.timestamp.transform) as Promise<number | null>,
    remote: getGitValue(cwd, commands.remote.envVar, commands.remote.gitCmd, commands.remote.transform) as Promise<string | null>,
  }) as Promise<CommitInfo>
}

export = {
  commitInfo,
  getGitCommands,
}
