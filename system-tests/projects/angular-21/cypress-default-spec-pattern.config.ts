import { defineConfig } from 'cypress'
import baseConfig from './cypress.config'

if (!baseConfig.component) {
  throw new Error('cypress.config.ts must define a component config')
}

const { specPattern: _specPattern, ...component } = baseConfig.component

export default defineConfig({
  ...baseConfig,
  component,
})
