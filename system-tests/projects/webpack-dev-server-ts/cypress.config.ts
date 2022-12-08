import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      bundler: 'webpack',
    } as any,
    supportFile: false,
  },
})
