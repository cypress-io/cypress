import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      bundler: 'webpack',
    } as any,
    supportFile: false,
  },
})
