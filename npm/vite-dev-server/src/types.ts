import type { InlineConfig } from 'vite'

export type CypressViteDevServerConfig = Omit<InlineConfig, 'base' | 'root'> & {
  /**
   * Path to an index.html file that will serve as the template in
   * which your components will be rendered.
   */
  indexHtmlFile?: string
}

export interface StartDevServer {
  /* this is the Cypress dev server configuration object */
  options: Cypress.DevServerConfig
  /* Base webpack config object used for loading component testing */
  viteConfig?: CypressViteDevServerConfig
  /* base html template to render in AUT */
  template?: string
  /* base html template to render in AUT */
  indexHtmlFile?: string
}
