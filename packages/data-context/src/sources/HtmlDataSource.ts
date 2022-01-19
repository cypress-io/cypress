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
    // run mode is not driven by GraphQL, so we don't
    // need the data from these queries.
    if (this.ctx.isRunMode) {
      return {}
    }

    const graphql = this.ctx.graphqlClient()

    await Promise.all([
      graphql.executeQuery('SettingsDocument', {}),
      graphql.executeQuery('SpecPageContainerDocument', {}),
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
        let html = await this.ctx.fs.readFile(getPathToDist('app', 'index.html'), 'utf8')

        return html.replace(
          '<title>Cypress</title>',
          `<title>${this.ctx.project.projectTitle(this.ctx.currentProject || '')}</title>`,
        )
      } catch (e) {
        err = e
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    throw err
  }

  async makeServeConfig () {
    const cfg = this.ctx._apis.projectApi.getConfig() ?? {} as any

    return {
      projectName: this.ctx.lifecycleManager.projectTitle,
      namespace: cfg.namespace || '__cypress-string',
      base64Config: Buffer.from(JSON.stringify(cfg)).toString('base64'),
    }
  }

  /**
   * The app html includes the SSR'ed data to bootstrap the page for the app
   */
  async appHtml (nonProxied: boolean) {
    // if (req.proxiedUrl?.startsWith('/')) {
    if (nonProxied) {
      // const PATH_TO_NON_PROXIED_ERROR = path.join(__dirname, '..', '..', 'server', 'lib', 'html', 'non_proxied_error.html')
      // console.log('asdasdsa', PATH_TO_NON_PROXIED_ERROR)
      return `
        <html>
          <head>
            <meta http-equiv="content-type" content="text/html;charset=utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cypress</title>

            <link href="/__cypress/runner/favicon.ico" rel="icon">

            <link rel="stylesheet" href="/__cypress/runner/cypress_runner.css">
          </head>
          <body>
            <div id="app">
              <div class="runner automation-failure">
                <div class="automation-message">
                  <p>Whoops, we can't run your tests.</p>
                  <div>
                    <p class="muted">This browser was not launched through Cypress. Tests cannot run.</p>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>

      `
    }

    const [appHtml, appInitialData, serveConfig] = await Promise.all([
      this.fetchAppHtml(),
      this.fetchAppInitialData(),
      this.makeServeConfig(),
    ])

    return this.replaceBody(appHtml, appInitialData, serveConfig)
  }

  private replaceBody (html: string, initialData: object, serveConfig: object) {
    // base64 before embedding so user-supplied contents can't break out of <script>
    // https://github.com/cypress-io/cypress/issues/4952
    const base64InitialData = Buffer.from(JSON.stringify(initialData)).toString('base64')

    return html.replace('<body>', `
      <body>
        <script>
          window.__RUN_MODE_SPECS__ = ${JSON.stringify(this.ctx.project.specs)}
          window.__CYPRESS_GRAPHQL_PORT__ = ${JSON.stringify(this.ctx.gqlServerPort)};
          window.__CYPRESS_INITIAL_DATA__ = "${base64InitialData}";
          window.__CYPRESS_MODE__ = ${JSON.stringify(this.ctx.isRunMode ? 'run' : 'open')}
          window.__CYPRESS_CONFIG__ = ${JSON.stringify(serveConfig)}
        </script>
    `)
  }
}
