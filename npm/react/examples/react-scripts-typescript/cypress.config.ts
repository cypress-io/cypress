import { defineConfig } from 'cypress'
const { devServer } = require('@cypress/react/plugins/react-scripts')

export default defineConfig({
  video: false,
  viewportWidth: 500,
  viewportHeight: 800,
  component: {
    devServer,
    componentFolder: 'src',
    specPattern: '**/*cy-spec.tsx',
  },
})
