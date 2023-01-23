/* eslint-disable no-console */
const execa = require('execa')
const _ = require('lodash')
const { Octokit } = require('@octokit/core')

const { getNextVersionForBinary } = require('../get-next-version')
const { getLinkedIssues } = require('./get-linked-issues')

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

/**
 * Get the version, commit date and git sha of the latest tag published on npm.
 */
const getCurrentReleaseData = async () => {
  console.log('Get Current Release Information\n')
  const { stdout } = await execa('npm', ['info', 'cypress', '--json'])
  const npmInfo = JSON.parse(stdout)

  const latestReleaseInfo = {
    version: npmInfo['dist-tags'].latest,
    commitDate: npmInfo.buildInfo.commitDate,
    buildSha: npmInfo.buildInfo.commitSha,
  }

  console.log({ latestReleaseInfo })

  return latestReleaseInfo
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
const getChangedFilesSinceLastRelease = async (latestReleaseInfo) => {
  const { stdout } = await execa('git', ['diff', `${latestReleaseInfo.buildSha}..`, '--name-only'])

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

    if (!references.length || !references[0].issue) {
      console.log('Commit does not have an associated pull request number...')

      return
    }

    const { data: pullRequest } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner: 'cypress-io',
      repo: 'cypress',
      pull_number: references[0].issue,
    })

    const associatedIssues = getLinkedIssues(pullRequest.body)

    commits.push({
      commitMessage: semanticResult.header,
      semanticType,
      prNumber: references[0].issue,
      associatedIssues,
    })

    prsInRelease.push(`https://github.com/cypress-io/cypress/pulls/${references[0].issue}`)

    associatedIssues.forEach((issueNumber) => {
      issuesInRelease.push(`https://github.com/cypress-io/cypress/issues/${issueNumber}`)
    })
  }))

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
    getCurrentReleaseData,
    getReleaseData,
  }

  return
}

(async () => {
  const latestReleaseInfo = await getCurrentReleaseData()

  const {
    changelogData,
    issuesInRelease,
    prsInRelease,
  } = await getReleaseData(latestReleaseInfo)

  console.log('Next release version is', changelogData.nextVersion)

  console.log(`${prsInRelease.length} user-facing pull requests have merged since ${latestReleaseInfo.version} was released.`)

  .prsInRelease.forEach((link) => {
    console.log('  -', link)
  })

  console.log(`${issuesInRelease.length} user-facing issues addressed since ${latestReleaseInfo.version} was released.`)

  issuesInRelease.forEach((link) => {
    console.log('  -', link)
  })
})()
