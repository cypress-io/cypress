import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    supportFile: false,
  },
  component: {
    supportFile: false,
    devServer: {
      bundler: 'vite',
      viteConfig: {},
    },
  },
})
