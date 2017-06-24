const rawRender = require('../raw_render')

module.exports = function usageOptions (hexo, args) {
  const opt = args[0]
  const type = args[1]

  const log = () => {
    /* eslint-disable quotes */
    const url = `{% url 'Command Log' overview-of-the-gui#Command-Log %}`

    return rawRender.call(this, hexo, `Whether to display the command in the ${url}`)
  }

  const force = () => {
    /* eslint-disable quotes */
    const url = `{% url 'waiting for actionability' interacting-with-elements#Bypassing %}`

    return rawRender.call(this, hexo, `Forces the <code>${type}</code>, disables ${url}`)
  }

  const timeout = () => {
    return `Total time to wait until the <code>${type}</code> times out and errors`
  }

  switch (opt) {
    case 'log':
      return log()
    case 'force':
      return force()
    case 'timeout':
      return timeout()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% usage_options %} tag helper was provided an invalid option: ${opt}`)
  }
}
