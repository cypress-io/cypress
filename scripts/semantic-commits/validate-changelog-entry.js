/* eslint-disable no-console */
const { userFacingChanges } = require('./change-categories')
const fs = require('fs')
const path = require('path')

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

function printChangeLogExample (semanticType, prNumber, associatedIssues) {
  const resolveMessage = _getResolvedMessage(semanticType, prNumber, associatedIssues)

  return `${userFacingChanges[semanticType].section}\n - <Insert change details>. ${resolveMessage}`
}

async function validateChangelogEntry ({ changedFiles, prNumber, semanticType, associatedIssues, nextVersion }) {
  const hasChangeLogUpdate = changedFiles.includes('cli/CHANGELOG.md')
  const binaryFiles = changedFiles.filter((filename) => {
    return /^(cli|packages)/.test(filename) && filename !== 'cli/CHANGELOG.md'
  })

  if (binaryFiles.length === 0) {
    console.log('This pull request does not contain changes that impacts the next Cypress release.')

    if (hasChangeLogUpdate) {
      // don't error here to allow updating an existing entry or fix punctuation
      console.log('Changelog entry is not required...')
    }

    return
  }

  if (!Object.keys(userFacingChanges).includes(semanticType)) {
    console.log('This pull request does not contain user-facing changes that impacts the next Cypress release.')

    if (hasChangeLogUpdate) {
      // don't error here to allow updating an existing entry or fix punctuation
      console.log('Changelog entry is not required...')
    }

    return
  }

  if (!hasChangeLogUpdate) {
    throw new Error(
      `A changelog entry was not found in cli/CHANGELOG.md. Please add a changelog entry that describes the changes made in this pull request. Include this entry under the section:/\n\n${printChangeLogExample(semanticType, prNumber, associatedIssues)}`,
    )
  }

  const changelog = fs.readFileSync(path.join(__dirname, '..', '..', 'cli', 'CHANGELOG.md'), 'utf8')

  console.log('changelog', changelog)
  if (nextVersion && !changelog.includes(`## ${nextVersion}`)) {
    throw new Error(`The changelog version does not contain the next Cypress version of ${nextVersion}. If the changelog version is correct, please correct the pull request title to correctly reflect the change being made.`)
  }

  if (!changelog.includes(userFacingChanges[semanticType].section)) {
    throw new Error(`The changelog does not include the ${userFacingChanges[semanticType].section} section. Given the pull request title provided, this section should be included in the changelog. If the changelog section is correct, please correct the pull request title to correctly reflect the change being made.`)
  }

  const resolveMessage = _getResolvedMessage(semanticType, prNumber, associatedIssues)

  if (!changelog.includes(resolveMessage)) {
    if (associatedIssues && associatedIssues.length) {
      throw new Error(`The changelog entry does not include the linked issues that this pull request resolves. Please update your entry to include:\n\n${resolveMessage}`)
    }

    throw new Error(`The changelog entry does not include the pull request link. Please update your entry to include:\n\n${resolveMessage}`)
  }

  console.log('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
}

module.exports = {
  validateChangelogEntry,
  _getResolvedMessage,
}
