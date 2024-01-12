const { userFacingChanges } = require('./change-categories')

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
function getResolvedMessage (semanticType, prNumber, associatedIssues = []) {
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

module.exports = {
  getResolvedMessage,
}
