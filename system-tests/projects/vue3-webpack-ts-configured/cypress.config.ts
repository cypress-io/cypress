import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
    },
  },
})
