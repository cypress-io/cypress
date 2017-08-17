const rawRender = require('../raw_render')

module.exports = function usageOptions (hexo, args) {
  const opt = args[0]
  const type = args[1]

  const render = (str) => {
    return rawRender.call(this, hexo, str)
  }

  const log = () => {
    /* eslint-disable quotes */
    const url = `{% url 'Command Log' overview-of-the-gui#Command-Log %}`

    return render(`Displays the command in the ${url}`)
  }

  const force = () => {
    /* eslint-disable quotes */
    const url = `{% urlHash 'waiting for actionability' Assertions %}`

    return render(`Forces the action, disables ${url}`)
  }

  const timeout = () => {
    /* eslint-disable quotes */
    const url = `{% urlHash 'timing out' Timeouts %}`

    return render(`Time to wait for <code>${type}()</code> to resolve before ${url}`)
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
