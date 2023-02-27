import { defineConfig } from 'cypress'
import defaultConfig from './cypress.config'

export default defineConfig({
  ...defaultConfig,
  component: {
    ...defaultConfig.component as Cypress.Config['component'],
    indexHtmlFile: 'cypress/support/component-custom-index.html',
  },
})