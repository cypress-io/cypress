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
    return this.ctx.fs.readFile(getPathToDist('app', 'index.html'), 'utf8')
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
