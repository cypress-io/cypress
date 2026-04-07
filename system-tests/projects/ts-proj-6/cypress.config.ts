import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  e2e: {},
  component: {
    supportFile: false,
    devServer: {
      bundler: 'vite',
      viteConfig: {},
    },
  },
})
