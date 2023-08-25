const { userFacingChanges } = require('./change-categories')
const { parseChangelog } = require('./parse-changelog')

// whether or not the semantic type is a user-facing semantic-type
const hasUserFacingChange = (type) => Object.keys(userFacingChanges).includes(type)

/**
 * Formats the resolved message that is appended to the changelog entry to indicate what
 * issues where addressed by a given change. If no issues are addressed, it references the
 * pull request which made the change.
 */
function _getResolvedMessage (semanticType, prNumber, associatedIssues = []) {
  if (associatedIssues.length) {
    const issueMessage = userFacingChanges[semanticType].message.hasIssue

    const links = associatedIssues.sort((a, b) => a - b)
    .map((issueNumber) => {
      return `[#${issueNumber}](https://github.com/cypress-io/cypress/issues/${issueNumber})`
    })

    return {
      message: issueMessage,
      links,
    }
  }

  const prMessage = userFacingChanges[semanticType].message.onlyPR

  return {
    message: prMessage,
    links: [`[#${prNumber}](https://github.com/cypress-io/cypress/pull/${prNumber})`],
  }
}

function _linksText (links) {
  // one issue: [#num]
  // two issues: [#num] and [#num]
  // two+ issues: [#num], [#num] and [#num]
  const linkMessage = [links.slice(0, -1).join(', '), links.slice(-1)[0]].join(links.length < 2 ? '' : ' and ')

  return linkMessage
}

function _printResolveExample ({ message, links }) {
  return `${message} ${_linksText(links)}.`
}

/**
 * Helper to format an example of what the changelog entry might look like for a given commit.
 */
function _printChangeLogExample (semanticType, prNumber, associatedIssues = []) {
  const resolveData = _getResolvedMessage(semanticType, prNumber, associatedIssues)

  return `${userFacingChanges[semanticType].section}\n\n - <Insert change details>. ${_printResolveExample(resolveData)}`
}

/**
 * Ensures the changelog entry was added to the correct changelog section given it's semantic commit type
 * and that it includes the correct reference(s) to the issue(s) or pull request the commit addressed.
 */
function _validateEntry (changelog, { commitMessage, prNumber, semanticType, associatedIssues }) {
  if (!hasUserFacingChange(semanticType)) {
    return
  }

  const expectedSection = userFacingChanges[semanticType].section
  let missingExpectedSection = !changelog[expectedSection]
  let sectionEntryFoundIn = ''

  const resolveData = _getResolvedMessage(semanticType, prNumber, associatedIssues)

  const hasMatchingEntry = Object.entries(userFacingChanges).some(([type, { section }]) => {
    const sectionDetails = changelog[section]

    if (!sectionDetails) {
      return false
    }

    const hasMatchingEntry = sectionDetails.some((detail) => {
      const index = detail.lastIndexOf(resolveData.message)

      if (index === undefined) return false // missing message

      const resolveString = detail.substring(index)

      return resolveData.links.every((link) => resolveString.includes(link))
    })

    if (hasMatchingEntry) {
      sectionEntryFoundIn = section
    }

    return hasMatchingEntry
  })

  if (missingExpectedSection) {
    return `The changelog does not include the ${expectedSection} section. Given the pull request title provided, this section should be included in the changelog. If the changelog section is correct, please correct the pull request title to correctly reflect the change being made.`
  }

  if (!hasMatchingEntry) {
    if (associatedIssues && associatedIssues.length) {
      return `The changelog entry does not include the linked issues that this pull request resolves. Please update your entry for '${commitMessage}' to include:\n\n${_printResolveExample(resolveData)}`
    }

    return `The changelog entry does not include the pull request link. Please update your entry for '${commitMessage}' to include:\n\n${_printResolveExample(resolveData)}`
  }

  if (hasMatchingEntry && sectionEntryFoundIn !== expectedSection) {
    return `Found the changelog entry in the wrong section. Expected the entry to be under the ${expectedSection} section, but found it in the ${sectionEntryFoundIn} section. Please move your entry to the correct changelog section.`
  }

  return
}

const _handleErrors = (errors) => {
  errors.forEach((err) => {
    console.log(err)
    console.log()
  })

  throw new Error('There was one or more errors when validating the changelog. See above for details.')
}

/**
 * Determines if the Cypress changelog has the correct next version and changelog entires given the provided
 * list of commits.
 *
 * Can be skipped by setting the SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES
 * environment variable in CircleCI to a branch or comma-separated list of
 * branches
 */
async function validateChangelog ({ changedFiles, nextVersion, pendingRelease, commits }) {
  if (process.env.SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES) {
    const branches = process.env.SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES.split(',')

    if (branches.includes(process.env.CIRCLE_BRANCH)) {
      console.log(`Skipping changelog validation because branch (${process.env.CIRCLE_BRANCH}) is included in SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES`)

      return []
    }
  }

  const hasUserFacingCommits = commits.some(({ semanticType }) => hasUserFacingChange(semanticType))

  if (!hasUserFacingCommits) {
    console.log('Does not contain any user-facing changes that impacts the next Cypress release.')

    return []
  }

  const hasChangeLogUpdate = changedFiles.includes('cli/CHANGELOG.md')
  const binaryFiles = changedFiles.filter((filename) => {
    return /^(cli|packages)/.test(filename) && filename !== 'cli/CHANGELOG.md'
  })

  let errors = []

  if (binaryFiles.length === 0) {
    console.log('Does not contain changes that impacts the next Cypress release.')

    return []
  }

  if (!hasChangeLogUpdate) {
    errors.push(`A changelog entry was not found in cli/CHANGELOG.md.`)

    if (commits.length === 1) {
      errors.push(`Please add a changelog entry that describes the changes. Include this entry under the section:\n\n${_printChangeLogExample(commits[0].semanticType, commits[0].prNumber, commits[0].associatedIssues)}`)

      return _handleErrors(errors)
    }
  }

  const changelog = await parseChangelog(pendingRelease)

  if (nextVersion && !changelog.version === `## ${nextVersion}`) {
    errors.push(`The changelog version does not contain the next Cypress version of ${nextVersion}. If the changelog version is correct, please correct the pull request title to correctly reflect the change being made.`)
  }

  commits.forEach(({ commitMessage, semanticType, prNumber, associatedIssues }) => {
    if (!Object.keys(userFacingChanges).includes(semanticType)) {
      return
    }

    if (!hasChangeLogUpdate) {
      _printChangeLogExample(semanticType, prNumber, associatedIssues)
    }

    const errMessage = _validateEntry(changelog, { commitMessage, semanticType, prNumber, associatedIssues })

    if (errMessage) {
      errors.push(errMessage)
    }
  })

  if (errors.length) {
    _handleErrors(errors)
  }

  console.log('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
}

module.exports = {
  validateChangelog,
  _validateEntry,
  _getResolvedMessage,
}
