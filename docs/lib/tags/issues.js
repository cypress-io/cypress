const Promise = require('bluebird')
const util = require('hexo-util')

function issue (hexo, args) {
  // {% issue 74 "not currently supported" %}

  const num = args[0]

  const attrs = {
    href: `https://github.com/cypress-io/cypress/issues/${num}`,
    target: '_blank',
  }

  const text = args[1] || `#${num}`

  return Promise.resolve(hexo.render.renderSync({ text, engine: 'markdown' }))
  .then((markdown) => {
    // remove <p> and </p> and \n
    markdown = markdown
    .split('<p>').join('')
    .split('</p>').join('')
    .split('\n').join('')

    return util.htmlTag('a', attrs, markdown)
  })
}

function openAnIssue (hexo, args) {
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
