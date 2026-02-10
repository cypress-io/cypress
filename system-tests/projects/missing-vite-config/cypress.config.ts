import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: false,
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
