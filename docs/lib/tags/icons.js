const rawRender = require('../raw_render')

function helperIconUrl (hexo, url) {
  const icon = '<i class="fa fa-question-circle"></i>'

  url = `{% url -placeholder- ${url} %}`

  return rawRender.call(this, hexo, url)
  .then((markdown) => {
    return markdown.replace('-placeholder-', icon)
  })
}

function fa (hexo, args) {
  // {% fa fa-angle-right green fa-fw %}
  //
  // <<< Transforms into >>>
  //
  // <i class="fa fa-angle-right"></i>

  const classNames = args.join(' ')

  return `<i class="fa ${classNames}"></i>`
}

function yields (hexo) {
  // {% yields %}

  return helperIconUrl.call(this, hexo, 'introduction-to-cypress#Subject-Management')
}

function timeout (hexo) {
  // {% timeout %}

  return helperIconUrl.call(this, hexo, 'introduction-to-cypress#Timeouts')
}

function defaultAssertion (hexo) {
  // {% default_assertion %}

  return helperIconUrl.call(this, hexo, 'introduction-to-cypress#Default-Assertions')
}

module.exports = {
  fa,

  yields,

  timeout,

  defaultAssertion,
}
