import { defineConfig } from 'cypress'
import defaultConfig from './cypress-webpack.config'

export default defineConfig({
  ...defaultConfig,
  component: {
    ...defaultConfig.component as Cypress.Config['component'],
    indexHtmlFile: 'my-component-index.html',
  },
})
