/**
 * Forms the HTML pages rendered to the client for Component / E2E testing,
 * including the pre-hydration we use to bootstrap the script data for fast
 * initial loading
 */
import type { DataContextShell } from '../DataContextShell'
import { getPathToDist } from '@packages/resolve-dist'

export class HtmlDataSource {
  constructor (private ctx: DataContextShell) {}

  async fetchAppInitialData () {
    const graphql = this.ctx.graphql

    await Promise.all([
      graphql.executeQuery('AppQueryDocument', {}),
      graphql.executeQuery('NewSpec_NewSpecQueryDocument', {}),
      graphql.executeQuery('ProjectSettingsDocument', {}),
      graphql.executeQuery('SpecsPageContainerDocument', {}),
      graphql.executeQuery('HeaderBar_HeaderBarQueryDocument', {}),
    ])

    return graphql.getSSRData()
  }

  async fetchAppHtml () {
    if (this.ctx.env.CYPRESS_INTERNAL_VITE_APP_PORT) {
      const response = await this.ctx.util.fetch(`http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`, { method: 'GET' })
      const html = await response.text()

      return html
    }

    return this.ctx.fs.readFile(getPathToDist('app'), 'utf8')
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
