/**
 * Forms the HTML pages rendered to the client for Component / E2E testing,
 * including the pre-hydration we use to bootstrap the script data for fast
 * initial loading
 */
import type { DataContext } from '../DataContext'
import { getPathToDist } from '@packages/resolve-dist'

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

  /**
   * The app html includes the SSR'ed data to bootstrap the page for the app
   */
  async appHtml () {
    const [appHtml, appInitialData] = await Promise.all([
      this.fetchAppHtml(),
      this.fetchAppInitialData(),
    ])

    return this.replaceBody(appHtml, appInitialData)
  }

  private replaceBody (html: string, initialData: object) {
    return html.replace('<body>', `
      <body>
        <script>
          window.__CYPRESS_GRAPHQL_PORT__ = ${JSON.stringify(this.ctx.gqlServerPort)};
          window.__CYPRESS_INITIAL_DATA__ = ${JSON.stringify(initialData)};
        </script>
    `)
  }
}
