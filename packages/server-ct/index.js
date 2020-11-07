const browsers = require('@packages/server/lib/browsers')
const Project = require('./src/project')

const DEFAULT_BROWSER_NAME = 'chrome'

const start = (projectRoot, options) => {
  const project = new Project(projectRoot)

  return project.open(options)
  .then((project) => {
    const { cfg } = project

    options.browsers = cfg.browsers
    options.proxyUrl = cfg.proxyUrl
    options.userAgent = cfg.userAgent
    options.proxyServer = null
    options.socketIoRoute = cfg.socketIoRoute
    options.chromeWebSecurity = cfg.chromeWebSecurity

    options.url = cfg.browserUrl

    const automation = {
      use () {},
    }

    return browsers.ensureAndGetByNameOrPath(DEFAULT_BROWSER_NAME)
    .then((browser) => {
      project.setCurrentSpecAndBrowser(null, browser)

      return browsers.open(browser, options, automation)
    })
  })
}

module.exports = {
  start,
}
