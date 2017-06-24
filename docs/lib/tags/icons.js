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

function helperIcon (hexo, args) {
  // {% helper_icon yields %}
  // {% helper_icon timeout %}
  // {% helper_icon defaultAssertion %}

  const type = args[0]

  switch (type) {
    case 'yields':
      return helperIconUrl.call(this, hexo, 'introduction-to-cypress#Subject-Management')

    case 'timeout':
      return helperIconUrl.call(this, hexo, 'introduction-to-cypress#Timeouts')

    case 'defaultAssertion':
      return helperIconUrl.call(this, hexo, 'introduction-to-cypress#Default-Assertions')

    default:
      // error when an invalid usage option was provided
      throw new Error(`{% helper_icon %} tag helper was provided an invalid type: ${type}`)
  }
}

module.exports = {
  fa,

  helperIcon,
}
