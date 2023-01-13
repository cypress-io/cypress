/* eslint-disable no-console */
const { userFacingChanges } = require('./change-categories')
const fs = require('fs')
const path = require('path')

const hasUserFacingChange = (type) => Object.keys(userFacingChanges).includes(type)

function _getResolvedMessage (semanticType, prNumber, associatedIssues = []) {
  if (associatedIssues.length) {
    const issueMessage = userFacingChanges[semanticType].message.hasIssue

    const links = associatedIssues.sort((a, b) => a - b)
    .map((issueNumber) => {
      return `[#${issueNumber}](https://github.com/cypress-io/cypress/issues/${issueNumber})`
    })

    // one issue: [#num]
    // two issues: [#num] and [#num]
    // two+ issues: [#num], [#num] and [#num]
    const linkMessage = [links.slice(0, -1).join(', '), links.slice(-1)[0]].join(links.length < 2 ? '' : ' and ')

    return `${issueMessage} ${linkMessage}.`
  }

  const prMessage = userFacingChanges[semanticType].message.onlyPR

  return `${prMessage} [#${prNumber}](https://github.com/cypress-io/cypress/pull/${prNumber}).`
}

function printChangeLogExample (semanticType, prNumber, associatedIssues = []) {
  const resolveMessage = _getResolvedMessage(semanticType, prNumber, associatedIssues)

  return `${userFacingChanges[semanticType].section}\n - <Insert change details>. ${resolveMessage}`
}

function _validateEntry (changelog, { commitMessage, prNumber, semanticType, associatedIssues }) {
  if (!hasUserFacingChange(semanticType)) {
    return []
  }

  const errors = []

  if (!changelog.includes(userFacingChanges[semanticType].section)) {
    errors.push(`The changelog does not include the ${userFacingChanges[semanticType].section} section. Given the pull request title provided, this section should be included in the changelog. If the changelog section is correct, please correct the pull request title to correctly reflect the change being made.`)
  }

  const resolveMessage = _getResolvedMessage(semanticType, prNumber, associatedIssues)

  if (!changelog.includes(resolveMessage)) {
    if (associatedIssues && associatedIssues.length) {
      errors.push(`The changelog entry does not include the linked issues that this pull request resolves. Please update your entry for '${commitMessage}' to include:\n\n${resolveMessage}`)
    } else {
      errors.push(`The changelog entry does not include the pull request link. Please update your entry for '${commitMessage}' to include:\n\n${resolveMessage}`)
    }
  }

  return errors
}

const _handleErrors = (errors) => {
  errors.forEach((err) => {
    console.log(err)
    console.log()
  })

  throw new Error('There was one or more errors when validating the changelog. See above for details.')
}

async function validateChangelog ({ changedFiles, nextVersion, commits }) {
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
      errors.push(`Please add a changelog entry that describes the changes. Include this entry under the section:/\n\n${printChangeLogExample(commits[0].semanticType, commits[0].prNumber, commits[0].associatedIssues)}`)

      return _handleErrors(errors)
    }
  }

  const changelog = fs.readFileSync(path.join(__dirname, '..', '..', 'cli', 'CHANGELOG.md'), 'utf8')

  if (nextVersion && !changelog.includes(`## ${nextVersion}`)) {
    errors.push(`The changelog version does not contain the next Cypress version of ${nextVersion}. If the changelog version is correct, please correct the pull request title to correctly reflect the change being made.`)
  }

  commits.forEach(({ commitMessage, semanticType, prNumber, associatedIssues }) => {
    if (!Object.keys(userFacingChanges).includes(semanticType)) {
      return
    }

    if (!hasChangeLogUpdate) {
      printChangeLogExample(semanticType, prNumber, associatedIssues)
    }

    const entryErrors = _validateEntry(changelog, { commitMessage, semanticType, prNumber, associatedIssues })

    errors = errors.concat(...entryErrors)
  })

  if (errors.length) {
    _handleErrors(errors)
  }

  console.log('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
}

module.exports = {
  validateChangelog,
  _validateEntry,
  // validateChangelog,
  // validateChangelogEntry,
  _getResolvedMessage,
}
