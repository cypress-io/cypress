import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
