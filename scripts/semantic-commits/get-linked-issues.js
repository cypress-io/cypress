const getLinkedIssues = (body = '') => {
  // remove markdown comments
  body.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '')

  const references = body.match(/(close[sd]?|fix(es|ed)?|resolve[s|d]?) (cypress-io\/cypress)?#\d+/gi)

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
