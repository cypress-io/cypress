const rawRender = require('../raw_render')

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
  // {% helper_icon requirements %}

  const type = args[0]

  const urlTo = (u) => {
    const str = `{% url -placeholder- ${u} %}`

    return rawRender.call(this, hexo, str)
    .then((markdown) => {
      const icon = '<i class="fa fa-question-circle"></i>'

      return markdown.replace('-placeholder-', icon)
    })
  }

  switch (type) {
    case 'yields':
      return urlTo('introduction-to-cypress#Subject-Management')

    case 'timeout':
      return urlTo('introduction-to-cypress#Timeouts')

    case 'assertions':
      return urlTo('introduction-to-cypress#Assertions')

    case 'requirements':
      return urlTo('introduction-to-cypress#Chains-of-Commands')

    default:
      // error when an invalid usage option was provided
      throw new Error(`{% helper_icon %} tag helper was provided an invalid type: ${type}`)
  }
}

module.exports = {
  fa,

  helperIcon,
}
