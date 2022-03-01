import type { InlineConfig } from 'vite'

export type CypressViteDevServerConfig = Omit<InlineConfig, 'base' | 'root'>

export interface StartDevServer {
  /* this is the Cypress dev server configuration object */
  options: Cypress.DevServerConfig
  /* Base webpack config object used for loading component testing */
  viteConfig?: CypressViteDevServerConfig
  /* base html template to render in AUT */
  template?: string
  /* base html template to render in AUT */
  indexHtml?: string
}
