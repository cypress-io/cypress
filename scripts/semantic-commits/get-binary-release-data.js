const Bluebird = require('bluebird')
const childProcess = require('child_process')
const _ = require('lodash')
const { Octokit } = require('@octokit/core')
const debugLib = require('debug')

const { getCurrentReleaseData } = require('./get-current-release-data')
const { getNextVersionForBinary } = require('../get-next-version')
const { getLinkedIssues } = require('./get-linked-issues')
const debug = debugLib('scripts:semantic-commits:get-binary-release-data')

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

// returns number of milliseconds to wait for retry
const getRetryAfter = (headers) => {
  // retry-after header is number of seconds to wait
  if (headers['retry-after'] && headers['retry-after'] !== '0') {
    return parseInt(headers['retry-after'], 10) * 1000
  }

  // x-ratelimit-reset header is the time in seconds since epoch after
  // which to retry
  if (headers['x-ratelimit-reset']) {
    const epochSeconds = parseInt(headers['x-ratelimit-reset'], 10)

    // turn it into milliseconds to wait and pad it by a second for good measure
    return (epochSeconds - (Date.now() / 1000)) * 1000 + 1000
  }

  // otherwise, just wait a minute
  return 6000
}

// https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#secondary-rate-limits
const parseRateLimit = (err) => {
  if (err.status === 403 && err.response?.data?.message.includes('secondary rate limit')) {
    const retryAfter = getRetryAfter(err.response?.headers)

    return {
      rateLimitHit: true,
      retryAfter,
    }
  }

  return {
    rateLimitHit: false,
  }
}

const fetchPullRequest = async (octokit, pullNumber) => {
  try {
    const { data: pullRequest } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner: 'cypress-io',
      repo: 'cypress',
      pull_number: pullNumber,
    })

    return pullRequest
  } catch (err) {
    const { rateLimitHit, retryAfter } = parseRateLimit(err)

    if (rateLimitHit) {
      console.log(`Rate limit hit - Retry fetching PR #${pullNumber} after ${retryAfter}ms`)

      return Bluebird.delay(retryAfter).then(() => fetchPullRequest(octokit, pullNumber))
    }

    throw err
  }
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

  await Bluebird.each(semanticCommits, (async (semanticResult) => {
    if (!semanticResult) return

    const { type: semanticType, references } = semanticResult

    if (!references.length) {
      console.log('Commit does not have an associated pull request number...')

      return
    }

    const refs = references.filter((r) => !r.raw.includes('revert #'))

    if (!refs.length) {
      console.log('Commit does not have an associated pull request number...')

      return
    }

    for (const [idx, ref] of refs.entries()) {
      let pullRequest

      try {
        pullRequest = await fetchPullRequest(octokit, ref.issue)
        debug(`Pull request #${ref.issue} found!`)
      } catch (err) {
        debug(`Error while fetching PR #${ ref.issue}:`, err)
        // If we have tried to fetch all other references and all of them failed,
        // print the failure of the last reference and exit
        if (idx === refs.length) {
          debug(`all references exhausted and no PR could be found!`)
          console.log(`Error while fetching PR #${ ref.issue}:`, err)
          throw err
        } else {
          // otherwise, we still might be able to link a PR to the commit
          debug(`Other references need to be tried. Continuing to see if we can find a corresponding pull request.`)
        }

        continue
      }

      const associatedIssues = pullRequest.body ? getLinkedIssues(pullRequest.body) : []

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

      // since we found our pull request, we don't need to check the rest of the references
      break
    }
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
