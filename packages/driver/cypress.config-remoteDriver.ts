// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig, REMOTE_DRIVER_SPECS } from './cypress.config'

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    specPattern: REMOTE_DRIVER_SPECS,
    experimentalRemoteDriver: true,
  },
  component: undefined,
})
