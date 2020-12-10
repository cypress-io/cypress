const browsers = require('@packages/server/lib/browsers')
const Project = require('./src/project-ct').default
const start = (projectRoot, options) => {
  const project = new Project(projectRoot)

  return project.open(options)
  .then(({ cfg }) => {
    options.browsers = cfg.browsers
    options.proxyUrl = cfg.proxyUrl
    options.userAgent = cfg.userAgent
    options.proxyServer = null
    options.socketIoRoute = cfg.socketIoRoute
    options.chromeWebSecurity = cfg.chromeWebSecurity

    options.url = cfg.browserUrl

    const automation = {
      use () {
      },
    }

    const [browser] = cfg.browsers

    project.setCurrentSpecAndBrowser(null, browser)

    return browsers.open(browser, options, automation)
  })
}

module.exports = {
  start,
}
