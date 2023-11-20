import { defineConfig } from 'cypress'
import defaultConfig from './cypress-vite.config'

export default defineConfig({
  ...defaultConfig,
  component: {
    ...defaultConfig.component as Cypress.Config['component'],
    supportFile: false,
  },
})
