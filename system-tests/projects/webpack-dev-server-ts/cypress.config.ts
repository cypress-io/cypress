import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      bundler: 'webpack',
    } as any,
    supportFile: false,
  },
})
