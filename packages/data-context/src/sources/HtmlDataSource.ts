/**
 * Forms the HTML pages rendered to the client for Component / E2E testing,
 * including the pre-hydration we use to bootstrap the script data for fast
 * initial loading
 */
import type { DataContext } from '../DataContext'
import { getPathToDist, resolveFromPackages } from '@packages/resolve-dist'
import _ from 'lodash'
import { telemetry } from '@packages/telemetry'

const PATH_TO_NON_PROXIED_ERROR = resolveFromPackages('server', 'lib', 'html', 'non_proxied_error.html')

export class HtmlDataSource {
  constructor (private ctx: DataContext) {}

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

  getPropertiesFromServerConfig (cfg: any = {}) {
    const keys = [
      'baseUrl',
      'browserUrl',
      'port',
      'proxyServer',
      'proxyUrl',
      'remote',
      'testingType',
      'componentTesting',
      'reporterUrl',
      'namespace',
      'socketIoRoute',
      'protocolEnabled',
      'hideCommandLog',
      'hideRunnerUi',
    ]

    return _.pick(cfg, keys)
  }

  async makeServeConfig () {
    const propertiesFromServerConfig = this.getPropertiesFromServerConfig(this.ctx._apis.projectApi.getConfig())

    let cfg = { ...propertiesFromServerConfig }

    try {
      cfg = {
        ...(await this.ctx.project.getConfig()),
        ...cfg,
      }
    } catch {
      // Error getting config, we will show an error screen when we render the page
    }

    // for project-base config, the remote state we wish to convey should be whatever top is set to, also known as the primary domain
    // whenever the app is served/re-served
    if (this.ctx.coreData.currentTestingType === 'e2e') {
      const remoteStates = this.ctx._apis.projectApi.getRemoteStates()

      if (remoteStates) {
        cfg.remote = remoteStates.getPrimary()
      }
    }

    cfg.browser = this.ctx._apis.projectApi.getCurrentBrowser()

    return {
      projectName: this.ctx.lifecycleManager.projectTitle,
      namespace: cfg.namespace || '__cypress-string',
      base64Config: Buffer.from(JSON.stringify(cfg)).toString('base64'),
      hideCommandLog: cfg.hideCommandLog,
      hideRunnerUi: cfg.hideRunnerUi,
    }
  }

  /**
   * The app html includes the SSR'ed data to bootstrap the page for the app
   */
  async appHtml (nonProxied: boolean) {
    if (nonProxied) {
      return this.ctx.fs.readFile(PATH_TO_NON_PROXIED_ERROR, 'utf-8')
    }

    const [appHtml, serveConfig] = await Promise.all([
      this.fetchAppHtml(),
      this.makeServeConfig(),
    ])

    return this.replaceBody(appHtml, serveConfig)
  }

  private replaceBody (html: string, serveConfig: object) {
    return html.replace('<body>', `
      <body>
        <script>
          window.__RUN_MODE_SPECS__ = ${JSON.stringify(this.ctx.project.specs)}
          window.__CYPRESS_MODE__ = ${JSON.stringify(this.ctx.isRunMode ? 'run' : 'open')};
          window.__CYPRESS_CONFIG__ = ${JSON.stringify(serveConfig)};
          window.__CYPRESS_TESTING_TYPE__ = '${this.ctx.coreData.currentTestingType}'
          window.__CYPRESS_BROWSER__ = ${JSON.stringify(this.ctx.coreData.activeBrowser)}
          ${telemetry.isEnabled() ? `window.__CYPRESS_TELEMETRY__ = ${JSON.stringify({ context: telemetry.getActiveContextObject(), resources: telemetry.getResources(), isVerbose: telemetry.isVerbose() })}` : ''}
          ${process.env.CYPRESS_INTERNAL_GQL_NO_SOCKET ? `window.__CYPRESS_GQL_NO_SOCKET__ = 'true';` : ''}
        </script>
    `)
  }
}
