import execa from 'execa'
import Promise from 'bluebird'

interface CommitInfo {
  branch: string | null
  message: string | null
  email: string | null
  author: string | null
  sha: string | null
  timestamp: number | null
  remote: string | null
}

/**
 * Collects Git commit info using git CLI commands.
 * Falls back to environment variables if git commands fail.
 *
 * @param folder - The folder path (defaults to current working directory)
 * @returns Promise resolving to commit info object
 */
function commitInfo (folder?: string): Promise<CommitInfo> {
  const cwd = folder || process.cwd()

  const getBranch = (): Promise<string | null> => {
    // Check environment variable first
    if (process.env.COMMIT_INFO_BRANCH) {
      return Promise.resolve(process.env.COMMIT_INFO_BRANCH)
    }

    return Promise.resolve(execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd }))
      .then((result) => {
        const branch = result.stdout.trim()

        // If this is detached commit (reporting HEAD), return null
        return branch === 'HEAD' ? null : branch
      })
      .catch(() => null)
  }

  const getMessage = (): Promise<string | null> => {
    if (process.env.COMMIT_INFO_MESSAGE) {
      return Promise.resolve(process.env.COMMIT_INFO_MESSAGE)
    }

    return Promise.resolve(execa('git', ['show', '-s', '--pretty=%B'], { cwd }))
      .then((result) => result.stdout.trim())
      .catch(() => null)
  }

  const getEmail = (): Promise<string | null> => {
    if (process.env.COMMIT_INFO_EMAIL) {
      return Promise.resolve(process.env.COMMIT_INFO_EMAIL)
    }

    return Promise.resolve(execa('git', ['log', '-1', '--pretty=format:%ae'], { cwd }))
      .then((result) => result.stdout.trim())
      .catch(() => null)
  }

  const getAuthor = (): Promise<string | null> => {
    if (process.env.COMMIT_INFO_AUTHOR) {
      return Promise.resolve(process.env.COMMIT_INFO_AUTHOR)
    }

    return Promise.resolve(execa('git', ['log', '-1', '--pretty=format:%an'], { cwd }))
      .then((result) => result.stdout.trim())
      .catch(() => null)
  }

  const getSha = (): Promise<string | null> => {
    if (process.env.COMMIT_INFO_SHA) {
      return Promise.resolve(process.env.COMMIT_INFO_SHA)
    }

    return Promise.resolve(execa('git', ['rev-parse', 'HEAD'], { cwd }))
      .then((result) => result.stdout.trim())
      .catch(() => null)
  }

  const getTimestamp = (): Promise<number | null> => {
    if (process.env.COMMIT_INFO_TIMESTAMP) {
      const timestamp = parseInt(process.env.COMMIT_INFO_TIMESTAMP, 10)

      return Promise.resolve(isNaN(timestamp) ? null : timestamp)
    }

    return Promise.resolve(execa('git', ['log', '-1', '--pretty=format:%ct'], { cwd }))
      .then((result) => {
        const timestamp = parseInt(result.stdout.trim(), 10)

        return isNaN(timestamp) ? null : timestamp
      })
      .catch(() => null)
  }

  const getRemote = (): Promise<string | null> => {
    if (process.env.COMMIT_INFO_REMOTE) {
      return Promise.resolve(process.env.COMMIT_INFO_REMOTE)
    }

    return Promise.resolve(execa('git', ['config', '--get', 'remote.origin.url'], { cwd }))
      .then((result) => result.stdout.trim())
      .catch(() => null)
  }

  return Promise.props({
    branch: getBranch(),
    message: getMessage(),
    email: getEmail(),
    author: getAuthor(),
    sha: getSha(),
    timestamp: getTimestamp(),
    remote: getRemote(),
  }) as Promise<CommitInfo>
}

export = {
  commitInfo,
}
