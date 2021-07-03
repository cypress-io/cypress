import { defineConfig } from 'cypress'
import injectNextDevServer from '@cypress/react/plugins/next'

export default defineConfig({
  component (on, config) {
    injectNextDevServer(on, config)
  },
})
