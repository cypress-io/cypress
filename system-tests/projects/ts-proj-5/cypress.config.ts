import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {},
  component: {
    supportFile: false,
    devServer: {
      bundler: 'vite',
      viteConfig: {},
    },
  },
})
