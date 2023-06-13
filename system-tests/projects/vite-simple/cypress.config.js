import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
