import browsers from '@packages/server/lib/browsers'
import ProjectCt from './src/project-ct'

// Partial because there are probably other options that are not included in this type.
export const start = async (projectRoot: string, options: unknown) => {
  const project = new ProjectCt(projectRoot)

  const { cfg } = await project.open(options)

  options.browsers = cfg.browsers // Cypress.Browser[]
  options.proxyUrl = cfg.proxyUrl // string
  options.userAgent = cfg.userAgent // string
  options.proxyServer = null // null
  options.socketIoRoute = cfg.socketIoRoute // string
  options.chromeWebSecurity = cfg.chromeWebSecurity // boolean
  options.url = cfg.browserUrl // string

  const automation = {
    use () {
    },
  }

  const [browser] = cfg.browsers as Cypress.Browser[]

  project.setCurrentSpecAndBrowser(null, browser)

  return browsers.open(browser, options, automation)
}
