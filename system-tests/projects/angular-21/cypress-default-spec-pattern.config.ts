import { defineConfig } from 'cypress'
import baseConfig from './cypress.config'

const { specPattern: _specPattern, ...component } = baseConfig.component ?? {}

export default defineConfig({
  ...baseConfig,
  component,
})
