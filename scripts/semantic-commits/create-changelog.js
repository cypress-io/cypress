const { userFacingChanges } = require('./change-categories')

// whether or not the semantic type is a user-facing semantic-type
const hasUserFacingChange = (type) => Object.keys(userFacingChanges).includes(type)

function _linksText (links) {
  // one issue: [#num]
  // two issues: [#num] and [#num]
  // two+ issues: [#num], [#num] and [#num]
  const linkMessage = [links.slice(0, -1).join(', '), links.slice(-1)[0]].join(links.length < 2 ? '' : ' and ')

  return linkMessage
}

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

    return `${issueMessage} ${_linksText(links)}.`
  }

  const prMessage = userFacingChanges[semanticType].message.onlyPR
  const links = [`[#${prNumber}](https://github.com/cypress-io/cypress/pull/${prNumber})`]

  return `${prMessage} ${_linksText(links)}.`
}

const _handleErrors = (errors) => {
  errors.forEach((err) => {
    console.log(err)
    console.log()
  })

  throw new Error('There was one or more errors when validating the changelog. See above for details.')
}

const addResolveMessageToChangesets = ({ commits, changesets }) => {
  const errors = []

  // loop through each semantic commit and add the resolve message (i.e. Fixed in [#1](link_to_issue).)
  // to the changeset
  commits.forEach(({ commitMessage, semanticType, prNumber, associatedIssues, changesetFilenames }) => {
    if (!hasUserFacingChange(semanticType)) {
      return
    }

    const resolveMessage = _getResolvedMessage(semanticType, prNumber, associatedIssues)

    // find each changeset file and add the resolveMessage details - most commits should only have one.
    changesetFilenames.forEach((file) => {
      // changesetFilename is uuid4.md, where as the git data returns the full file path <-- update this
      const match = changesets.find((c) => file.includes(c.changesetFilename))

      if (!match) {
        errors.push(`Missing changeset for ${commitMessage}. Manually add an entry before release Cypress`)

        return
      }

      console.log(`"${match.entry}"`)
      // verify the change entry ends with punctuation.
      if (match.entry.charAt(match.entry.length - 1) !== '.') {
        console.log('add period...')
        match.entry = `${match.entry}. ${resolveMessage}`
      } else {
        match.entry = `${match.entry} ${resolveMessage}`
      }

      if (match.type !== semanticType) {
        errors.push(`NEEDS ACTION: The type associated with ${match.changesetFilename} is ${match.type}, but this commit was checked into Git with type ${semanticType}. It is possible mis-match could cause a Cypress version discrepancy. Verify the bumped version is correct.`)
        // overriding to matched the committed type
        match.type = semanticType
      }
    })
  })

  return errors
}

/**
 * Determines if the Cypress changelog has the correct next version and changelog entires given the provided
 * list of commits.
 *
 * Can be skipped by setting the SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES
 * environment variable in CircleCI to a branch or comma-separated list of
 * branches
 */
async function createChangelog ({ nextVersion, commits, changesets }) {
  const hasUserFacingCommits = commits.some(({ semanticType }) => hasUserFacingChange(semanticType))

  if (!hasUserFacingCommits) {
    console.log('Does not contain any user-facing changes that impacts the next Cypress release.')

    return []
  }

  let changelog = []

  changelog.push(`## ${nextVersion}\n`)
  changelog.push(`_Released 1/16/2024_\n`) // TODO REAL DATE

  const errors = addResolveMessageToChangesets({ commits, changesets })

  // loop through each changelog category and add any entries
  Object.entries(userFacingChanges).forEach(([semanticType, { section }]) => {
    const entriesForType = changesets.filter((c) => c.type === semanticType)

    if (!entriesForType.length) {
      console.log(`There are no ${semanticType} commits in this release.`)

      return
    }

    // add changelog section
    changelog.push(`${section}\n`)

    // add each changelog entry
    entriesForType.forEach(({ entry }) => changelog.push(`- ${entry}`))

    changelog.push('') // line break between sections
  })

  if (errors.length) {
    _handleErrors(errors)
  }

  return changelog
}

module.exports = {
  createChangelog,
  _getResolvedMessage,
}
