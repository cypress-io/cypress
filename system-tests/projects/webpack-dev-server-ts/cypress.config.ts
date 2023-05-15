import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      bundler: 'webpack',
    } as any,
    supportFile: false,
  },
})
