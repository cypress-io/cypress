const rawRender = require('../raw_render')

module.exports = function usageOptions (hexo, args) {
  const opt = args[0]
  const type = args[1]

  const log = () => {
    /* eslint-disable quotes */
    const url = `{% url 'Command Log' overview-of-the-gui#Command-Log %}`

    return rawRender.call(this, hexo, `Displays the command in the ${url}`)
  }

  const force = () => {
    /* eslint-disable quotes */
    const url = `{% url 'waiting for actionability' interacting-with-elements#Bypassing %}`

    return rawRender.call(this, hexo, `Forces the action, disables ${url}`)
  }

  const timeout = () => {
    /* eslint-disable quotes */
    const url = `{% urlHash 'timing out' Timeout %}`

    return rawRender.call(this, hexo, `Time to wait for <code>${type}()</code> to resolve before ${url}`)
  }

  const multiple = () => {
    return 'Serially click multiple elements'
  }

  switch (opt) {
    case 'log':
      return log()
    case 'force':
      return force()
    case 'multiple':
      return multiple()
    case 'timeout':
      return timeout()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% usage_options %} tag helper was provided an invalid option: ${opt}`)
  }
}
