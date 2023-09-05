import { defineConfig } from 'cypress'
import { devServer } from '@cypress/react/plugins/react-scripts'

export default defineConfig({
  component: {
    devServer,
  },
})
