/**
 * Forms the HTML pages rendered to the client for Component / E2E testing,
 * including the pre-hydration we use to bootstrap the script data for fast
 * initial loading
 */
import type { DataContext } from '../DataContext'
import { getPathToDist } from '@packages/resolve-dist'
import type { FoundBrowser } from '@packages/types'
import type { TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'

export interface ServeConfig {
  config: string
  testingType: TestingTypeEnum | null
  browser: FoundBrowser | null
}

export class HtmlDataSource {
  constructor (private ctx: DataContext) {}

  async fetchLaunchpadInitialData () {
    const graphql = this.ctx.graphqlClient()

    await Promise.all([
      graphql.executeQuery('HeaderBar_HeaderBarQueryDocument', {}),
      graphql.executeQuery('AppQueryDocument', {}),
      graphql.executeQuery('MainLaunchpadQueryDocument', {}),
    ])

    return graphql.getSSRData()
  }

  async fetchAppInitialData () {
    const graphql = this.ctx.graphqlClient()

    await Promise.all([
      graphql.executeQuery('SettingsDocument', {}),
      graphql.executeQuery('SpecsPageContainerDocument', {}),
      graphql.executeQuery('HeaderBar_HeaderBarQueryDocument', {}),
      graphql.executeQuery('SideBarNavigationDocument', {}),
    ])

    return graphql.getSSRData()
  }

  async fetchAppHtml () {
    if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
      const response = await this.ctx.util.fetch(`http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`, { method: 'GET' })
      const html = await response.text()

      return html
    }

    // Check if the file exists. If it doesn't, it probably means that Vite is re-building
    // and we should retry a few times until the file exists
    let retryCount = 0
    let err

    while (retryCount < 5) {
      try {
        return await this.ctx.fs.readFile(getPathToDist('app', 'index.html'), 'utf8')
      } catch (e) {
        err = e
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    throw err
  }

  async makeServeConfig () {
    return {
      projectName: this.ctx.lifecycleManager.projectTitle,
      base64Config: Buffer.from(JSON.stringify(this.ctx._apis.projectApi.getConfig())).toString('base64'),
    }
  }

  /**
   * The app html includes the SSR'ed data to bootstrap the page for the app
   */
  async appHtml () {
    const [appHtml, appInitialData, serveConfig] = await Promise.all([
      this.fetchAppHtml(),
      this.fetchAppInitialData(),
      this.makeServeConfig(),
    ])

    return this.replaceBody(appHtml, appInitialData, serveConfig)
  }

  private replaceBody (html: string, initialData: object, serveConfig: object) {
    return html.replace('<body>', `
      <body>
        <script>
          window.__CYPRESS_GRAPHQL_PORT__ = ${JSON.stringify(this.ctx.gqlServerPort)};
          window.__CYPRESS_INITIAL_DATA__ = ${JSON.stringify(initialData)};
          window.__CYPRESS_CONFIG__ = ${JSON.stringify(serveConfig)}
        </script>
    `)
  }
}
