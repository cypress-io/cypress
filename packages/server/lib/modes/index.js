const { DEFAULT_BROWSER_NAME } = require('./component-testing')

module.exports = (mode, options) => {
  switch (mode) {
    case 'componentTestingInteractive':
      return require('./component-testing').run(options)

    case 'componentTestingRun':
      // set options.browser to chrome unless already set
      options.browser = options.browser || DEFAULT_BROWSER_NAME

      // if we're in run mode with component
      // testing then just pass this through
      // without waiting on electron to be ready
      return require('./run').ready(options)

    case 'record':
      return require('./record').run(options)
    case 'run':
      return require('./run').run(options)
    case 'interactive':
      return require('./interactive').run(options)
    case 'smokeTest':
      return require('./smoke_test').run(options)
    default:
      break
  }
}
