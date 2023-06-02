const childProcess = require('child_process')
const _ = require('lodash')
const { Octokit } = require('@octokit/core')

const { getCurrentReleaseData } = require('./get-current-release-data')
const { getNextVersionForBinary } = require('../get-next-version')
const { getLinkedIssues } = require('./get-linked-issues')

const ensureAuth = () => {
  if (!process.env.GH_TOKEN) {
    throw new Error('The GH_TOKEN env is not set.')
  }
}

/**
 * Get the list of file names that have been added, deleted or changed since the git
 * sha associated with the latest tag published on npm.
 *
 * @param {object} latestReleaseInfo - data of the latest tag published on npm
 * @param {string} latestReleaseInfo.version - version of Cypress
 * @param {string} latestReleaseInfo.commitDate - data of release
 * @param {string} latestReleaseInfo.buildSha - git commit associated with published content
 */
const getChangedFilesSinceLastRelease = (latestReleaseInfo) => {
  const stdout = childProcess.execSync(`git diff ${latestReleaseInfo.buildSha}.. --name-only`, { encoding: 'utf8' })

  if (!stdout) {
    console.log('no files changes since last release')

    return []
  }

  return stdout.split('\n')
}

/**
 * Get the next release version given the semantic commits in the git history. Then using the commit history,
 * determine which files have changed, list of PRs merged and issues resolved since the latest tag was
 * published on npm. It also collects the list of commit data including the semantic type, PR and associated
 * issues.
 *
 * @param {object} latestReleaseInfo - data of the latest tag published on npm
 * @param {string} latestReleaseInfo.version - version of Cypress
 * @param {string} latestReleaseInfo.commitDate - data of release
 * @param {string} latestReleaseInfo.buildSha - git commit associated with published content
 */
const getReleaseData = async (latestReleaseInfo) => {
  ensureAuth()
  const octokit = new Octokit({ auth: process.env.GH_TOKEN })

  let {
    nextVersion,
    commits: semanticCommits,
  } = await getNextVersionForBinary()

  semanticCommits = _.uniqBy(semanticCommits, (commit) => commit.header)

  const changedFiles = await getChangedFilesSinceLastRelease(latestReleaseInfo)

  const issuesInRelease = []
  const prsInRelease = []
  const commits = []

  await Promise.all(semanticCommits.map(async (semanticResult) => {
    if (!semanticResult) return

    const { type: semanticType, references } = semanticResult

    if (!references.length) {
      console.log('Commit does not have an associated pull request number...')

      return
    }

    const ref = references.find((r) => !r.raw.includes('revert #'))

    if (!ref) {
      console.log('Commit does not have an associated pull request number...')

      return
    }

    const { data: pullRequest } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner: 'cypress-io',
      repo: 'cypress',
      pull_number: ref.issue,
    })

    const associatedIssues = getLinkedIssues(pullRequest.body)

    commits.push({
      commitMessage: semanticResult.header,
      semanticType,
      prNumber: ref.issue,
      associatedIssues,
    })

    prsInRelease.push(`https://github.com/cypress-io/cypress/pull/${ref.issue}`)

    associatedIssues.forEach((issueNumber) => {
      issuesInRelease.push(`https://github.com/cypress-io/cypress/issues/${issueNumber}`)
    })
  }))

  console.log('Next release version is', nextVersion)

  console.log(`${prsInRelease.length} pull requests have merged since ${latestReleaseInfo.version} was released.`)

  prsInRelease.forEach((link) => {
    console.log('  -', link)
  })

  console.log(`${issuesInRelease.length} issues addressed since ${latestReleaseInfo.version} was released.`)

  issuesInRelease.forEach((link) => {
    console.log('  -', link)
  })

  return {
    nextVersion,
    changedFiles,
    commits,
    issuesInRelease,
    prsInRelease,
  }
}

if (require.main !== module) {
  module.exports = {
    getReleaseData,
  }

  return
}

(async () => {
  const latestReleaseInfo = await getCurrentReleaseData()

  await getReleaseData(latestReleaseInfo)
})()
