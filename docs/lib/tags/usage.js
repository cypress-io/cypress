const rawRender = require('../raw_render')

module.exports = function (hexo, args) {
  const opt = args[0]
  const type = args[1]

  const logUsage = (hexo) => {
    /* eslint-disable quotes */
    const url = `{% url 'Command Log' overview-of-the-gui#Command-Log %}`

    return rawRender.call(this, hexo, `Whether to display the command in the ${url}`)
  }

  const forceUsage = (hexo, type) => {
    /* eslint-disable quotes */
    const url = `{% url 'waiting for actionability' interacting-with-elements#Bypassing %}`

    return rawRender.call(this, hexo, `Forces the ${type}, disables ${url}`)
  }

  switch (opt) {
    case 'log':
      return logUsage(hexo)
    case 'force':
      return forceUsage(hexo, type)
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% usage_options %} tag helper was provided an invalid option: ${opt}`)
  }
}
