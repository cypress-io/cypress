/**
 * Parses the pull request body to find any associated github issues that were
 * resolved when the pull request merged.
 * @returns list of associated issue numbers
 */
const getLinkedIssues = (body) => {
  // Strip what GitHub hides when it renders the body: closed comments
  // (including the empty `<!-->` and `<!--->`), and an unclosed comment that
  // starts a line, which hides everything after it. An unclosed `<!--` anywhere
  // else renders as text. Replacing with a space stops text split by a comment,
  // like `fix<!-- -->es #1`, from counting as a reference. `<!--` inside a code
  // span or fence is not special-cased.
  const visibleBody = (body ?? '').replace(/<!--(?:-?>|[\s\S]*?-->)|^<!--[\s\S]*/gm, ' ')

  const references = visibleBody.match(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?) (?:(?:cypress-io\/cypress)?#\d+|https:\/\/github\.com\/cypress-io\/cypress\/issues\/\d+)/gi)

  if (!references) {
    return []
  }

  const issues = []

  references.forEach((issue) => {
    issues.push(issue.match(/\d+/)[0])
  })

  return issues.filter((v, i, a) => a.indexOf(v) === i)
}

module.exports = {
  getLinkedIssues,
}
