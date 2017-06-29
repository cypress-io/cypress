const util = require('hexo-util')

function issue (args) {
  // {% issue 74 'not currently supported' %}

  const num = args[0]

  const attrs = {
    href: `https://github.com/cypress-io/cypress/issues/${num}`,
    target: '_blank',
  }

  const text = args[1] || `issue #${num}`

  return util.htmlTag('a', attrs, text)
}

function openAnIssue (args) {
  // {% open_an_issue %}
  // {% open_an_issue 'here' %}

  const attrs = {
    href: 'https://github.com/cypress-io/cypress/issues/new',
    target: '_blank',
  }

  const text = args[0] || 'Open an issue'

  return util.htmlTag('a', attrs, text)
}

module.exports = {
  issue,

  openAnIssue,
}
