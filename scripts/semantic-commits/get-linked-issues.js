/**
 * Parses the pull request body to find any associated github issues that were
 * resolved when the pull request merged.
 * @returns list of associated issue numbers
 */
const getLinkedIssues = (body = '') => {
  // remove markdown comments
  body.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '')

  const references = body.match(/(close[sd]?|fix(es|ed)?|resolve[s|d]?) ((cypress-io\/cypress)?#\d+|https\:\/\/github.com\/cypress-io\/cypress\/issues\/\d+)/gi)

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
