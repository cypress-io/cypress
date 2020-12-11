import browsers from '@packages/server/lib/browsers'
import Project from './src/project-ct'

interface OpenConfig {
  componentTesting: boolean
  project: string
  cwd: string
  invokedFromCli: boolean
  config: Record<string, unknown>
  projectRoot: string
  browsers: Cypress.Browser[]
  proxyUrl: string
  userAgent: boolean
  socketIoRoute: string
  chromeWebSecurity: boolean
  proxyServer?: string
}

// Partial because there are probably other options that are not included in this type.
export const start = async (projectRoot: string, options: OpenConfig) => {
  const project = new Project(projectRoot)

  const { cfg } = await project.open(options)

  options.browsers = cfg.browsers
  options.proxyUrl = cfg.proxyUrl
  options.userAgent = cfg.userAgent
  options.proxyServer = null
  options.socketIoRoute = cfg.socketIoRoute
  options.chromeWebSecurity = cfg.chromeWebSecurity

  // @ts-ignore
  options.url = cfg.browserUrl

  const automation = {
    use () {
    },
  }

  const [browser] = cfg.browsers as Cypress.Browser[]

  project.setCurrentSpecAndBrowser(null, browser)

  return browsers.open(browser, options, automation)
}
