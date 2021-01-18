const serverCt = require('@packages/server-ct')

const getDefaultBrowser = (browser) => {
  // set options.browser to chrome unless already set
  return browser || 'chrome'
}

const launchInteractiveMode = (options) => {
  const { projectRoot } = options

  options.browser = getDefaultBrowser(options.browser)

  return serverCt.start(projectRoot, options)
}

const launchRunMode = (options) => {
  options.browser = getDefaultBrowser(options.browser)

  // if we're in run mode with component
  // testing then just pass this through
  // without waiting on electron to be ready
  return require('./run').ready(options)
}

module.exports = {
  launchRunMode,
  launchInteractiveMode,
}
